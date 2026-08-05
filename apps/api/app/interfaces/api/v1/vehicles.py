# ruff: noqa: N815

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.operational_categories import OPERATIONAL_CATEGORIES
from app.infrastructure.database.models.checklist_model import ChecklistTemplateModel
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.models.vehicle_model import VehicleModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/vehicles", tags=["Frota de Veículos"])


class VehiclePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model: str = Field(min_length=2, max_length=255)
    plate: str = Field(min_length=7, max_length=10)
    year: int = Field(default=2024, ge=1980, le=2100)
    currentKm: int = Field(default=0, ge=0)
    category: str = "INSTALACAO_MANUTENCAO"
    status: str = "DISPONIVEL"
    assignedTechnicianId: str | None = None
    assignedChecklistTemplateId: str | None = None


class VehicleResponse(VehiclePayload):
    id: str
    assignedTechnicianName: str | None = None
    assignedChecklistTitle: str | None = None
    lastInspectionDate: str | None = None


class BatchAssignRequest(BaseModel):
    templateId: str
    vehicleIds: list[str] = Field(min_length=1)


async def _validate_assignments(
    payload: VehiclePayload, session: AsyncSession
) -> None:
    if payload.category not in OPERATIONAL_CATEGORIES:
        raise HTTPException(status_code=422, detail="Categoria operacional inválida.")
    if payload.assignedTechnicianId:
        technician = await session.get(UserModel, payload.assignedTechnicianId)
        if not technician or technician.role != "TECNICO":
            raise HTTPException(status_code=422, detail="Técnico responsável inválido.")
        if technician.operational_category != payload.category:
            raise HTTPException(
                status_code=422,
                detail="O técnico e o veículo devem ter a mesma categoria.",
            )
    if payload.assignedChecklistTemplateId:
        checklist = await session.get(
            ChecklistTemplateModel, payload.assignedChecklistTemplateId
        )
        if not checklist or checklist.status != "published":
            raise HTTPException(status_code=422, detail="Checklist publicado inválido.")
        if checklist.distribution_scope != "VEHICLE":
            raise HTTPException(
                status_code=422,
                detail="Este checklist não utiliza atribuição por veículo.",
            )
        if checklist.category != payload.category:
            raise HTTPException(
                status_code=422,
                detail="O checklist e o veículo devem ter a mesma categoria.",
            )


async def _response(
    vehicle: VehicleModel, session: AsyncSession
) -> VehicleResponse:
    technician_name = None
    checklist_title = None
    if vehicle.assigned_technician_id:
        technician = await session.get(UserModel, vehicle.assigned_technician_id)
        technician_name = technician.full_name if technician else None
    if vehicle.assigned_checklist_template_id:
        checklist = await session.get(
            ChecklistTemplateModel, vehicle.assigned_checklist_template_id
        )
        checklist_title = checklist.title if checklist else None
    return VehicleResponse(
        id=vehicle.id,
        model=vehicle.model,
        plate=vehicle.plate,
        year=vehicle.year,
        currentKm=vehicle.current_km,
        category=vehicle.category,
        status=vehicle.status,
        assignedTechnicianId=vehicle.assigned_technician_id,
        assignedTechnicianName=technician_name,
        assignedChecklistTemplateId=vehicle.assigned_checklist_template_id,
        assignedChecklistTitle=checklist_title,
    )


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    session: AsyncSession = Depends(get_db),
) -> list[VehicleResponse]:
    result = await session.execute(select(VehicleModel).order_by(VehicleModel.plate))
    return [await _response(vehicle, session) for vehicle in result.scalars().all()]


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehiclePayload, session: AsyncSession = Depends(get_db)
) -> VehicleResponse:
    await _validate_assignments(payload, session)
    normalized_plate = payload.plate.replace("-", "").upper()
    existing = await session.scalar(
        select(VehicleModel).where(VehicleModel.plate == normalized_plate)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Já existe um veículo com esta placa.")
    vehicle = VehicleModel(
        model=payload.model.strip(),
        plate=normalized_plate,
        year=payload.year,
        current_km=payload.currentKm,
        category=payload.category,
        status=payload.status,
        assigned_technician_id=payload.assignedTechnicianId,
        assigned_checklist_template_id=payload.assignedChecklistTemplateId,
    )
    session.add(vehicle)
    await session.commit()
    await session.refresh(vehicle)
    return await _response(vehicle, session)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: str,
    payload: VehiclePayload,
    session: AsyncSession = Depends(get_db),
) -> VehicleResponse:
    vehicle = await session.get(VehicleModel, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")
    await _validate_assignments(payload, session)
    normalized_plate = payload.plate.replace("-", "").upper()
    duplicate = await session.scalar(
        select(VehicleModel).where(
            VehicleModel.plate == normalized_plate, VehicleModel.id != vehicle_id
        )
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Já existe um veículo com esta placa.")
    vehicle.model = payload.model.strip()
    vehicle.plate = normalized_plate
    vehicle.year = payload.year
    vehicle.current_km = payload.currentKm
    vehicle.category = payload.category
    vehicle.status = payload.status
    vehicle.assigned_technician_id = payload.assignedTechnicianId
    vehicle.assigned_checklist_template_id = payload.assignedChecklistTemplateId
    await session.commit()
    await session.refresh(vehicle)
    return await _response(vehicle, session)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: str, session: AsyncSession = Depends(get_db)
) -> None:
    vehicle = await session.get(VehicleModel, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")
    await session.delete(vehicle)
    await session.commit()


@router.post("/batch-assign")
async def batch_assign(
    request: BatchAssignRequest, session: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    checklist = await session.get(ChecklistTemplateModel, request.templateId)
    if not checklist or checklist.status != "published":
        raise HTTPException(
            status_code=422, detail="Selecione um checklist publicado válido."
        )
    if checklist.distribution_scope != "VEHICLE":
        raise HTTPException(status_code=422, detail="Este checklist não utiliza atribuição por veículo.")
    result = await session.execute(
        select(VehicleModel).where(VehicleModel.id.in_(request.vehicleIds))
    )
    vehicles = result.scalars().all()
    if len(vehicles) != len(set(request.vehicleIds)):
        raise HTTPException(status_code=422, detail="Selecione veículos válidos.")
    if any(vehicle.category != checklist.category for vehicle in vehicles):
        raise HTTPException(
            status_code=422,
            detail="Selecione apenas veículos da categoria do checklist.",
        )
    for vehicle in vehicles:
        vehicle.assigned_checklist_template_id = checklist.id
    await session.commit()
    return {
        "message": f"Checklist vinculado a {len(vehicles)} veículo(s).",
        "updatedCount": len(vehicles),
    }

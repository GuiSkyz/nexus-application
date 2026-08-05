# ruff: noqa: N815

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.infrastructure.database.models.incident_model import ActionPlanModel, IncidentModel
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.user_model import UserModel

router = APIRouter(prefix="/incidents", tags=["Não Conformidades e Planos de Ação"])


class ActionPlanResponse(BaseModel):
    id: str
    incidentId: str
    description: str
    assignedTo: str
    dueDate: str
    createdAt: str
    createdBy: str
    resolvedAt: str | None = None
    resolutionNotes: str | None = None


class IncidentResponse(BaseModel):
    id: str
    inspectionId: str | None = None
    inspectionTitle: str
    contextType: str
    vehiclePlate: str | None = None
    vehicleModel: str | None = None
    technicianName: str
    teamName: str
    questionText: str
    category: str
    severity: str
    status: str
    reportedAt: str
    description: str | None = None
    actionPlan: ActionPlanResponse | None = None


class IncidentPayload(BaseModel):
    inspectionId: str | None = None
    inspectionTitle: str = Field(min_length=3)
    contextType: str = "ACTIVITY"
    vehiclePlate: str | None = None
    vehicleModel: str | None = None
    technicianName: str = Field(min_length=3)
    teamName: str = Field(min_length=2)
    questionText: str = Field(min_length=3)
    category: str = Field(min_length=2)
    severity: str = "MEDIA"
    status: str = "ABERTA"
    description: str | None = None


class CreateActionPlanRequest(BaseModel):
    description: str = Field(min_length=3)
    assignedTo: str = Field(min_length=2)
    dueDate: str
    createdBy: str = "Supervisor Operacional"


class ResolveIncidentRequest(BaseModel):
    resolutionNotes: str = Field(min_length=3)


class SubmitIncidentReviewRequest(BaseModel):
    resolutionNotes: str = Field(min_length=3)


def _ensure_management(user: UserModel) -> None:
    if user.role == "TECNICO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas a gestão pode aprovar ou devolver não conformidades.",
        )


def _action_plan_response(action_plan: ActionPlanModel) -> ActionPlanResponse:
    return ActionPlanResponse(
        id=action_plan.id,
        incidentId=action_plan.incident_id,
        description=action_plan.description,
        assignedTo=action_plan.assigned_to,
        dueDate=action_plan.due_date,
        createdAt=action_plan.created_at.isoformat(),
        createdBy=action_plan.created_by,
        resolvedAt=action_plan.resolved_at,
        resolutionNotes=action_plan.resolution_notes,
    )


def _incident_response(incident: IncidentModel) -> IncidentResponse:
    plan = (
        _action_plan_response(incident.action_plans[0])
        if incident.action_plans
        else None
    )
    return IncidentResponse(
        id=incident.code,
        inspectionId=incident.inspection_id,
        inspectionTitle=incident.inspection_title,
        contextType=incident.context_type,
        vehiclePlate=incident.vehicle_plate,
        vehicleModel=incident.vehicle_model,
        technicianName=incident.technician_name,
        teamName=incident.team_name,
        questionText=incident.question_text,
        category=incident.category,
        severity=incident.severity,
        status=incident.status,
        reportedAt=incident.created_at.isoformat(),
        description=incident.description,
        actionPlan=plan,
    )


def _statement():
    return select(IncidentModel).options(selectinload(IncidentModel.action_plans))


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    session: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
    status_filter: str | None = None,
    severity: str | None = None,
) -> list[IncidentResponse]:
    statement = _statement().order_by(IncidentModel.created_at.desc())
    if user.role == "TECNICO":
        statement = statement.where(IncidentModel.technician_name == user.full_name)
    if status_filter and status_filter != "ALL":
        statement = statement.where(IncidentModel.status == status_filter)
    if severity and severity != "ALL":
        statement = statement.where(IncidentModel.severity == severity)
    result = await session.execute(statement)
    return [_incident_response(item) for item in result.scalars().unique().all()]


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    request: IncidentPayload, session: AsyncSession = Depends(get_db)
) -> IncidentResponse:
    year = datetime.now(UTC).year
    total = await session.scalar(select(func.count()).select_from(IncidentModel)) or 0
    incident = IncidentModel(
        code=f"NC-{year}-{total + 1:04d}",
        inspection_id=request.inspectionId,
        inspection_title=request.inspectionTitle,
        context_type=request.contextType,
        vehicle_plate=request.vehiclePlate,
        vehicle_model=request.vehicleModel,
        technician_name=request.technicianName,
        team_name=request.teamName,
        question_text=request.questionText,
        category=request.category,
        severity=request.severity,
        status=request.status,
        description=request.description,
    )
    session.add(incident)
    await session.commit()
    result = await session.execute(_statement().where(IncidentModel.id == incident.id))
    return _incident_response(result.scalar_one())


@router.put("/{incident_code}", response_model=IncidentResponse)
async def update_incident(
    incident_code: str,
    request: IncidentPayload,
    session: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    result = await session.execute(
        _statement().where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    incident.inspection_id = request.inspectionId
    incident.inspection_title = request.inspectionTitle
    incident.context_type = request.contextType
    incident.vehicle_plate = request.vehiclePlate
    incident.vehicle_model = request.vehicleModel
    incident.technician_name = request.technicianName
    incident.team_name = request.teamName
    incident.question_text = request.questionText
    incident.category = request.category
    incident.severity = request.severity
    incident.status = request.status
    incident.description = request.description
    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)


@router.delete("/{incident_code}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_code: str, session: AsyncSession = Depends(get_db)
) -> None:
    incident = await session.scalar(
        select(IncidentModel).where(IncidentModel.code == incident_code)
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    await session.delete(incident)
    await session.commit()


@router.post("/{incident_code}/action-plan", response_model=IncidentResponse)
async def create_action_plan(
    incident_code: str,
    request: CreateActionPlanRequest,
    session: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
) -> IncidentResponse:
    _ensure_management(user)
    result = await session.execute(
        _statement().where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    if incident.action_plans:
        plan = incident.action_plans[0]
        plan.description = request.description
        plan.assigned_to = request.assignedTo
        plan.due_date = request.dueDate
        plan.created_by = request.createdBy
    else:
        incident.action_plans.append(
            ActionPlanModel(
                id=str(uuid.uuid4()),
                description=request.description,
                assigned_to=request.assignedTo,
                due_date=request.dueDate,
                created_by=request.createdBy,
            )
        )
    incident.status = "PLANO_DE_ACAO"
    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)


@router.post("/{incident_code}/submit-review", response_model=IncidentResponse)
async def submit_incident_for_review(
    incident_code: str,
    request: SubmitIncidentReviewRequest,
    session: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
) -> IncidentResponse:
    if user.role != "TECNICO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este envio deve ser feito pelo técnico responsável.",
        )
    result = await session.execute(
        _statement().where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    if incident.technician_name != user.full_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta não conformidade não está vinculada a você.",
        )
    if not incident.action_plans:
        raise HTTPException(
            status_code=409,
            detail="Aguarde a gestão atribuir um plano de ação antes de enviar a correção.",
        )
    if incident.status != "PLANO_DE_ACAO":
        raise HTTPException(
            status_code=409,
            detail="Esta não conformidade não está disponível para envio.",
        )
    incident.action_plans[0].resolution_notes = request.resolutionNotes
    incident.action_plans[0].resolved_at = None
    incident.status = "EM_ANALISE"
    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)


@router.post("/{incident_code}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_code: str,
    request: ResolveIncidentRequest,
    session: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
) -> IncidentResponse:
    _ensure_management(user)
    result = await session.execute(
        _statement().where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    if incident.status != "EM_ANALISE":
        raise HTTPException(
            status_code=409,
            detail="A correção precisa ser enviada pelo técnico antes da aprovação.",
        )
    incident.status = "RESOLVIDA"
    if incident.action_plans:
        incident.action_plans[0].resolved_at = datetime.now(UTC).isoformat()
        incident.action_plans[0].resolution_notes = request.resolutionNotes
    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)


@router.post("/{incident_code}/reopen", response_model=IncidentResponse)
async def reopen_incident(
    incident_code: str,
    request: ResolveIncidentRequest,
    session: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
) -> IncidentResponse:
    _ensure_management(user)
    result = await session.execute(
        _statement().where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
    if incident.status != "EM_ANALISE" or not incident.action_plans:
        raise HTTPException(
            status_code=409,
            detail="A não conformidade não possui uma correção em análise.",
        )
    incident.action_plans[0].resolution_notes = request.resolutionNotes
    incident.action_plans[0].resolved_at = None
    incident.status = "PLANO_DE_ACAO"
    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)

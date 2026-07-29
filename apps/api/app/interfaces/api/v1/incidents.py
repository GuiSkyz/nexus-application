import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.incident_model import ActionPlanModel, IncidentModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/incidents", tags=["Não Conformidades & Planos de Ação"])


class ActionPlanResponse(BaseModel):
    id: str
    incidentId: str
    description: str
    assignedTo: str
    dueDate: str
    createdAt: str
    createdBy: str
    resolvedAt: Optional[str] = None
    resolutionNotes: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    inspectionId: Optional[str] = None
    inspectionTitle: str
    contextType: str
    vehiclePlate: Optional[str] = None
    vehicleModel: Optional[str] = None
    technicianName: str
    teamName: str
    questionText: str
    category: str
    severity: str
    status: str
    reportedAt: str
    description: Optional[str] = None
    actionPlan: Optional[ActionPlanResponse] = None


class CreateActionPlanRequest(BaseModel):
    description: str = Field(..., description="Descrição detalhada do plano de ação corretiva")
    assignedTo: str = Field(..., description="Setor/Pessoa responsável pela execução")
    dueDate: str = Field(..., description="Data limite para conclusão")
    createdBy: str = Field(default="Supervisor Operacional")


class ResolveIncidentRequest(BaseModel):
    resolutionNotes: str = Field(..., description="Observações comprovatórias da resolução")


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


def _incident_response(
    incident: IncidentModel,
    action_plan: ActionPlanResponse | None = None,
) -> IncidentResponse:
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
        actionPlan=action_plan,
    )


@router.get(
    "",
    response_model=List[IncidentResponse],
    summary="Listagem de Não Conformidades (NC)",
)
async def list_incidents(
    session: AsyncSession = Depends(get_db),
    status: Optional[str] = None,
    severity: Optional[str] = None,
) -> list[IncidentResponse]:
    statement = select(IncidentModel).options(selectinload(IncidentModel.action_plans))
    if status and status != "ALL":
        statement = statement.where(IncidentModel.status == status)
    if severity and severity != "ALL":
        statement = statement.where(IncidentModel.severity == severity)

    result = await session.execute(statement)
    incidents = result.scalars().all()
    return [
        _incident_response(
            incident,
            _action_plan_response(incident.action_plans[0])
            if incident.action_plans
            else None,
        )
        for incident in incidents
    ]


@router.post(
    "/{incident_code}/action-plan",
    response_model=IncidentResponse,
    summary="Cadastro de Plano de Ação para uma NC",
)
async def create_action_plan(
    incident_code: str,
    request: CreateActionPlanRequest,
    session: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    result = await session.execute(
        select(IncidentModel).where(IncidentModel.code == incident_code)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")

    action_plan = ActionPlanModel(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        description=request.description,
        assigned_to=request.assignedTo,
        due_date=request.dueDate,
        created_by=request.createdBy,
    )
    session.add(action_plan)
    incident.status = "PLANO_DE_ACAO"
    await session.commit()
    await session.refresh(incident)
    await session.refresh(action_plan)

    return _incident_response(incident, _action_plan_response(action_plan))


@router.post(
    "/{incident_code}/resolve",
    response_model=IncidentResponse,
    summary="Baixa e conclusão da Não Conformidade",
)
async def resolve_incident(
    incident_code: str,
    request: ResolveIncidentRequest,
    session: AsyncSession = Depends(get_db),
) -> IncidentResponse:
    statement = (
        select(IncidentModel)
        .options(selectinload(IncidentModel.action_plans))
        .where(IncidentModel.code == incident_code)
    )
    result = await session.execute(statement)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")

    incident.status = "RESOLVIDA"
    if incident.action_plans:
        incident.action_plans[0].resolved_at = datetime.now(timezone.utc).isoformat()
        incident.action_plans[0].resolution_notes = request.resolutionNotes

    await session.commit()
    await session.refresh(incident)
    return _incident_response(incident)

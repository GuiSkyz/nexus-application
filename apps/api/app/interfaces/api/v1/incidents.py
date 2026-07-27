from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

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


from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.database.models.incident_model import IncidentModel, ActionPlanModel
import uuid
from datetime import datetime, timezone
@router.get("", response_model=List[IncidentResponse], summary="Listagem de Não Conformidades (NC)")
async def list_incidents(status: Optional[str] = None, severity: Optional[str] = None) -> Any:
    async with AsyncSessionLocal() as session:
        stmt = select(IncidentModel).options(selectinload(IncidentModel.action_plans))
        if status and status != "ALL":
            stmt = stmt.where(IncidentModel.status == status)
        if severity and severity != "ALL":
            stmt = stmt.where(IncidentModel.severity == severity)
            
        result = await session.execute(stmt)
        incidents = result.scalars().all()
        
        response_list = []
        for inc in incidents:
            ap_data = None
            if inc.action_plans:
                ap = inc.action_plans[0]
                ap_data = ActionPlanResponse(
                    id=ap.id if hasattr(ap, 'id') else str(uuid.uuid4()),
                    incidentId=ap.incident_id,
                    description=ap.description,
                    assignedTo=ap.assignedTo if hasattr(ap, 'assignedTo') else ap.assigned_to,
                    dueDate=ap.due_date,
                    createdAt=ap.created_at.isoformat() if hasattr(ap, 'created_at') else "",
                    createdBy=ap.created_by,
                    resolvedAt=ap.resolved_at,
                    resolutionNotes=ap.resolution_notes
                )
                
            response_list.append(
                IncidentResponse(
                    id=inc.code,
                    inspectionId=inc.inspection_id,
                    inspectionTitle=inc.inspection_title,
                    contextType=inc.context_type,
                    vehiclePlate=inc.vehicle_plate,
                    vehicleModel=inc.vehicle_model,
                    technicianName=inc.technician_name,
                    teamName=inc.team_name,
                    questionText=inc.question_text,
                    category=inc.category,
                    severity=inc.severity,
                    status=inc.status,
                    reportedAt=inc.created_at.isoformat() if hasattr(inc, 'created_at') else datetime.now(timezone.utc).isoformat(),
                    description=inc.description,
                    actionPlan=ap_data
                )
            )
        return response_list


@router.post("/{incident_code}/action-plan", response_model=IncidentResponse, summary="Cadastro de Plano de Ação para uma NC")
async def create_action_plan(incident_code: str, req: CreateActionPlanRequest) -> Any:
    async with AsyncSessionLocal() as session:
        stmt = select(IncidentModel).where(IncidentModel.code == incident_code)
        result = await session.execute(stmt)
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
            
        new_plan = ActionPlanModel(
            id=str(uuid.uuid4()),
            incident_id=incident.id,
            description=req.description,
            assigned_to=req.assignedTo,
            due_date=req.dueDate,
            created_by=req.createdBy
        )
        session.add(new_plan)
        incident.status = "PLANO_DE_ACAO"
        
        await session.commit()
        await session.refresh(incident)
        
        ap_data = ActionPlanResponse(
            id=new_plan.id,
            incidentId=new_plan.incident_id,
            description=new_plan.description,
            assignedTo=new_plan.assigned_to,
            dueDate=new_plan.due_date,
            createdAt=datetime.now(timezone.utc).isoformat(),
            createdBy=new_plan.created_by
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
        reportedAt=datetime.now(timezone.utc).isoformat(),
        description=incident.description,
        actionPlan=ap_data
    )


@router.post("/{incident_code}/resolve", response_model=IncidentResponse, summary="Baixa e conclusão da Não Conformidade")
async def resolve_incident(incident_code: str, req: ResolveIncidentRequest) -> Any:
    async with AsyncSessionLocal() as session:
        stmt = select(IncidentModel).options(selectinload(IncidentModel.action_plans)).where(IncidentModel.code == incident_code)
        result = await session.execute(stmt)
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")
            
        incident.status = "RESOLVIDA"
        if incident.action_plans:
            incident.action_plans[0].resolved_at = datetime.now(timezone.utc).isoformat()
            incident.action_plans[0].resolution_notes = req.resolutionNotes
            
        await session.commit()
        await session.refresh(incident)
        
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
        reportedAt=datetime.now(timezone.utc).isoformat(),
        description=incident.description,
        actionPlan=None # Pode ignorar no response de resolver
    )

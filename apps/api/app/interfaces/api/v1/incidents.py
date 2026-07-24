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


# Store em memória para testes do backend
mock_incidents_api_db = [
  {
    "id": "NC-2026-089",
    "inspectionId": "insp-101",
    "inspectionTitle": "Vistoria Diária de Saída — Veículos da Frota",
    "contextType": "VEHICLE",
    "vehiclePlate": "ABC1D23",
    "vehicleModel": "Fiat Strada Endurance (Caminhonete 12)",
    "technicianName": "João Souza",
    "teamName": "Equipe Alfa - Instalação",
    "category": "Segurança Mecânica",
    "questionText": "Calibragem e estado dos 4 pneus e estepe da Caminhonete 12 estão adequados?",
    "severity": "CRITICA",
    "status": "PLANO_DE_ACAO",
    "reportedAt": "2026-07-23T07:45:00Z",
    "description": "Pneu dianteiro esquerdo apresentando desgaste excessivo na banda de rodagem (careca). Risco de estouro.",
    "actionPlan": {
      "id": "ap-101",
      "incidentId": "NC-2026-089",
      "description": "Encaminhar Caminhonete 12 à oficina credenciada AutoCenter para substituição de 2 pneus dianteiros e alinhamento.",
      "assignedTo": "Manutenção da Frota / AutoCenter",
      "dueDate": "2026-07-24T18:00:00Z",
      "createdAt": "2026-07-23T09:30:00Z",
      "createdBy": "Roberto Alcantara (Coordenador)",
    },
  },
  {
    "id": "NC-2026-085",
    "inspectionId": "insp-98",
    "inspectionTitle": "Inspeção de Segurança em Altura (NR-35)",
    "contextType": "ACTIVITY",
    "technicianName": "Marcos Oliveira",
    "teamName": "Equipe Beta - Infraestrutura",
    "category": "Equipamentos NR-35",
    "questionText": "Escada de fibra isolada acoplada ao rack sem trincas nos degraus?",
    "severity": "ALTA",
    "status": "ABERTA",
    "reportedAt": "2026-07-22T14:15:00Z",
    "description": "Degrau #4 com fissura visível na resina de fibra. Equipamento interditado preventivamente.",
  },
]


@router.get("", response_model=List[IncidentResponse], summary="Listagem de Não Conformidades (NC)")
async def list_incidents(status: Optional[str] = None, severity: Optional[str] = None) -> Any:
    filtered = mock_incidents_api_db
    if status:
        filtered = [i for i in filtered if i["status"] == status]
    if severity:
        filtered = [i for i in filtered if i["severity"] == severity]
    return filtered


@router.post("/{incident_id}/action-plan", response_model=IncidentResponse, summary="Cadastro de Plano de Ação para uma NC")
async def create_action_plan(incident_id: str, req: CreateActionPlanRequest) -> Any:
    for incident in mock_incidents_api_db:
        if incident["id"] == incident_id:
            action_plan = {
                "id": f"ap-{len(mock_incidents_api_db) + 100}",
                "incidentId": incident_id,
                "description": req.description,
                "assignedTo": req.assignedTo,
                "dueDate": req.dueDate,
                "createdAt": "2026-07-23T17:30:00Z",
                "createdBy": req.createdBy,
            }
            incident["actionPlan"] = action_plan
            incident["status"] = "PLANO_DE_ACAO"
            return incident

    raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")


@router.post("/{incident_id}/resolve", response_model=IncidentResponse, summary="Baixa e conclusão da Não Conformidade")
async def resolve_incident(incident_id: str, req: ResolveIncidentRequest) -> Any:
    for incident in mock_incidents_api_db:
        if incident["id"] == incident_id:
            incident["status"] = "RESOLVIDA"
            if incident.get("actionPlan"):
                incident["actionPlan"]["resolvedAt"] = "2026-07-23T17:35:00Z"
                incident["actionPlan"]["resolutionNotes"] = req.resolutionNotes
            return incident

    raise HTTPException(status_code=404, detail="Não conformidade não encontrada.")

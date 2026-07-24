from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/vehicles", tags=["Frota de Veículos"])


class VehicleResponse(BaseModel):
    id: str
    model: str
    plate: str
    year: int
    currentKm: int
    category: str
    status: str
    assignedTechnicianId: Optional[str] = None
    assignedTechnicianName: Optional[str] = None
    assignedChecklistTemplateId: Optional[str] = None
    assignedChecklistTitle: Optional[str] = None
    lastInspectionDate: Optional[str] = None


class CreateVehicleRequest(BaseModel):
    model: str
    plate: str
    year: int = 2024
    currentKm: int = 0
    category: str = "INSTALACAO"
    status: str = "DISPONIVEL"
    assignedTechnicianId: Optional[str] = None
    assignedChecklistTemplateId: Optional[str] = None


class BatchAssignRequest(BaseModel):
    templateId: str
    vehicleIds: List[str]


# Store em memória para testes do backend
mock_vehicles_db = [
  {
    "id": "veh-01",
    "model": "Fiat Strada Endurance 1.4",
    "plate": "ABC1D23",
    "year": 2023,
    "currentKm": 42150,
    "category": "INSTALACAO",
    "status": "DISPONIVEL",
    "assignedTechnicianId": "tech-01",
    "assignedTechnicianName": "João Souza (Equipe Alfa)",
    "assignedChecklistTemplateId": "tpl-101",
    "assignedChecklistTitle": "Vistoria Diária de Saída — Veículos da Frota (v1.0)",
    "lastInspectionDate": "Hoje às 07:45",
  },
  {
    "id": "veh-02",
    "model": "Renault Kangoo Express 1.6",
    "plate": "XYZ9E87",
    "year": 2022,
    "currentKm": 68900,
    "category": "MANUTENCAO_FIBRA",
    "status": "EM_VISTORIA",
    "assignedTechnicianId": "tech-02",
    "assignedTechnicianName": "Marcos Oliveira (Equipe Beta)",
    "assignedChecklistTemplateId": "tpl-101",
    "assignedChecklistTitle": "Vistoria Diária de Saída — Veículos da Frota (v1.0)",
    "lastInspectionDate": "Ontem às 17:30",
  },
  {
    "id": "veh-03",
    "model": "Chevrolet S10 Cabine Dupla 2.8",
    "plate": "KGB4F12",
    "year": 2024,
    "currentKm": 12400,
    "category": "INFRAESTRUTURA",
    "status": "DISPONIVEL",
    "assignedTechnicianId": "tech-03",
    "assignedTechnicianName": "Carlos Eduardo",
    "assignedChecklistTemplateId": "tpl-103",
    "assignedChecklistTitle": "Checklist de Equipamentos de Lançamento de Cabo",
    "lastInspectionDate": "19/07/2026",
  },
]


@router.get("", response_model=List[VehicleResponse], summary="Listagem completa da frota de veículos")
async def list_vehicles() -> Any:
    return mock_vehicles_db


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, summary="Cadastro de veículo na frota")
async def create_vehicle(req: CreateVehicleRequest) -> Any:
    new_veh = {
        "id": f"veh-0{len(mock_vehicles_db) + 1}",
        "model": req.model,
        "plate": req.plate.upper(),
        "year": req.year,
        "currentKm": req.currentKm,
        "category": req.category,
        "status": req.status,
        "assignedTechnicianId": req.assignedTechnicianId,
        "assignedTechnicianName": "Técnico Alocado" if req.assignedTechnicianId else None,
        "assignedChecklistTemplateId": req.assignedChecklistTemplateId,
        "assignedChecklistTitle": "Checklist Padrão Atribuído" if req.assignedChecklistTemplateId else None,
        "lastInspectionDate": "Nunca inspecionado",
    }
    mock_vehicles_db.append(new_veh)
    return new_veh


@router.post("/batch-assign", summary="Atribuição de 1 checklist publicado a múltiplos veículos em lote")
async def batch_assign(req: BatchAssignRequest) -> Any:
    updated_count = 0
    for v in mock_vehicles_db:
        if v["id"] in req.vehicleIds:
            v["assignedChecklistTemplateId"] = req.templateId
            v["assignedChecklistTitle"] = f"Checklist Replicado ({req.templateId})"
            updated_count += 1

    return {"message": f"Checklist vinculado com sucesso a {updated_count} veículo(s).", "updatedCount": updated_count}

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/checklists", tags=["Templates de Checklist"])


class ChecklistQuestionResponse(BaseModel):
    id: str
    category: str
    questionText: str
    type: str = "yes_no"
    isRequired: bool = True
    requirePhoto: bool = False
    requireJustification: bool = False


class ChecklistSectionResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    questions: List[ChecklistQuestionResponse] = []


class ChecklistTemplateResponse(BaseModel):
    id: str
    templateFamilyId: str
    title: str
    category: str
    description: Optional[str] = None
    status: str  # draft, published, archived
    version: int
    isLatestVersion: bool
    createdAt: str
    createdBy: str
    publishedAt: Optional[str] = None
    archivedAt: Optional[str] = None
    usageCount: int = 0
    sections: List[ChecklistSectionResponse] = []


class CreateChecklistRequest(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    sections: List[Dict[str, Any]] = []


# Store em memória para testes do backend
mock_checklists_db = [
  {
    "id": "chk-001",
    "templateFamilyId": "tpl-101",
    "title": "Vistoria Diária de Saída — Veículos da Frota",
    "category": "Veículos & Transportes",
    "description": "Checklist obrigatório de pré-uso para caminhonetes e carros operacionais da frota.",
    "status": "published",
    "version": 1,
    "isLatestVersion": True,
    "createdAt": "2026-07-01T08:00:00Z",
    "createdBy": "Roberto Alcantara (Coordenador)",
    "publishedAt": "2026-07-02T10:30:00Z",
    "usageCount": 142,
    "sections": [
      {
        "id": "sec-01",
        "title": "Segurança & Documentação do Veículo",
        "description": "Itens obrigatórios de rodagem",
        "questions": [
          {
            "id": "q-101",
            "category": "Documentação",
            "questionText": "CRLV atualizado e seguro obrigatório estão presentes no porta-luvas?",
            "type": "yes_no_na",
            "isRequired": True,
            "requirePhoto": False,
            "requireJustification": True,
          },
          {
            "id": "q-102",
            "category": "Equipamentos Obrigatórios",
            "questionText": "Triângulo de sinalização, macaco hidráulico e chave de roda operacionais?",
            "type": "yes_no",
            "isRequired": True,
            "requirePhoto": True,
            "requireJustification": False,
          },
        ],
      }
    ],
  },
  {
    "id": "chk-002",
    "templateFamilyId": "tpl-102",
    "title": "Inspeção de Segurança em Altura (NR-35)",
    "category": "Segurança do Trabalho",
    "description": "Verificação rigorosa de cinto paraquedista, talabarte, trava-quedas e ancoragem.",
    "status": "published",
    "version": 1,
    "isLatestVersion": True,
    "createdAt": "2026-07-10T14:00:00Z",
    "createdBy": "Roberto Alcantara (Coordenador)",
    "publishedAt": "2026-07-11T09:00:00Z",
    "usageCount": 89,
    "sections": [],
  },
  {
    "id": "chk-003",
    "templateFamilyId": "tpl-103",
    "title": "Manutenção Preventiva de Máquinas e Ferramentas",
    "category": "Manutenção Operacional",
    "description": "Rascunho inicial para vistoria técnica de máquinas de fusão óptica.",
    "status": "draft",
    "version": 1,
    "isLatestVersion": True,
    "createdAt": "2026-07-20T16:45:00Z",
    "createdBy": "Roberto Alcantara (Coordenador)",
    "usageCount": 0,
    "sections": [],
  },
]


@router.get("", response_model=List[ChecklistTemplateResponse], summary="Listagem de templates de checklist")
async def list_checklists(status: Optional[str] = None) -> Any:
    if status:
        return [c for c in mock_checklists_db if c["status"] == status]
    return mock_checklists_db


@router.post("", response_model=ChecklistTemplateResponse, status_code=status.HTTP_201_CREATED, summary="Criação de rascunho de checklist")
async def create_checklist(req: CreateChecklistRequest) -> Any:
    new_chk = {
        "id": f"chk-00{len(mock_checklists_db) + 1}",
        "templateFamilyId": f"tpl-{200 + len(mock_checklists_db)}",
        "title": req.title,
        "category": req.category,
        "description": req.description,
        "status": "draft",
        "version": 1,
        "isLatestVersion": True,
        "createdAt": "2026-07-23T16:00:00Z",
        "createdBy": "Coordenador Técnico",
        "usageCount": 0,
        "sections": req.sections,
    }
    mock_checklists_db.append(new_chk)
    return new_chk


@router.post("/{checklist_id}/publish", response_model=ChecklistTemplateResponse, summary="Publicação de checklist")
async def publish_checklist(checklist_id: str) -> Any:
    for c in mock_checklists_db:
        if c["id"] == checklist_id:
            c["status"] = "published"
            c["publishedAt"] = "2026-07-23T16:30:00Z"
            return c
    raise HTTPException(status_code=404, detail="Template de checklist não encontrado.")


@router.post("/{checklist_id}/archive", response_model=ChecklistTemplateResponse, summary="Arquivamento de checklist")
async def archive_checklist(checklist_id: str) -> Any:
    for c in mock_checklists_db:
        if c["id"] == checklist_id:
            c["status"] = "archived"
            c["archivedAt"] = "2026-07-23T16:35:00Z"
            return c
    raise HTTPException(status_code=404, detail="Template de checklist não encontrado.")


@router.delete("/{checklist_id}", summary="Exclusão de checklist")
async def delete_checklist(checklist_id: str) -> Any:
    global mock_checklists_db
    for c in mock_checklists_db:
        if c["id"] == checklist_id:
            if c["status"] == "published" or c["usageCount"] > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Regra RBAC: Checklists já publicados ou com histórico de uso não podem ser excluídos definitivamente.",
                )
            mock_checklists_db = [item for item in mock_checklists_db if item["id"] != checklist_id]
            return {"message": "Checklist excluído com sucesso."}
    raise HTTPException(status_code=404, detail="Template de checklist não encontrado.")

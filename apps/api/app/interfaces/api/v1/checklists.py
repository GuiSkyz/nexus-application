# ruff: noqa: N815

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.checklist_model import (
    ChecklistQuestionModel,
    ChecklistSectionModel,
    ChecklistTemplateModel,
)
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/checklists", tags=["Templates de Checklist"])


class QuestionPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str | None = None
    text: str = Field(min_length=3)
    type: str = "yes_no"
    isRequired: bool = True
    requirePhoto: bool = False
    requireJustification: bool = False
    order: int = 1


class SectionPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str | None = None
    title: str = Field(min_length=2)
    description: str | None = None
    order: int = 1
    questions: list[QuestionPayload] = Field(default_factory=list)


class ChecklistPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(min_length=3, max_length=255)
    category: str = Field(min_length=2, max_length=100)
    description: str | None = None
    createdBy: str = "Coordenação Operacional"
    sections: list[SectionPayload] = Field(default_factory=list)


class QuestionResponse(QuestionPayload):
    id: str


class SectionResponse(SectionPayload):
    id: str
    questions: list[QuestionResponse]


class ChecklistResponse(BaseModel):
    id: str
    templateId: str
    title: str
    category: str
    description: str | None
    status: str
    version: int
    isLatestVersion: bool
    createdBy: str
    createdAt: str
    updatedAt: str
    publishedAt: str | None = None
    archivedAt: str | None = None
    usageCount: int
    sections: list[SectionResponse]


def _response(template: ChecklistTemplateModel) -> ChecklistResponse:
    updated = template.updated_at.isoformat()
    return ChecklistResponse(
        id=template.id,
        templateId=template.template_family_id,
        title=template.title,
        category=template.category,
        description=template.description,
        status=template.status,
        version=template.version,
        isLatestVersion=template.is_latest_version,
        createdBy=template.created_by,
        createdAt=template.created_at.isoformat(),
        updatedAt=updated,
        publishedAt=updated if template.status == "published" else None,
        archivedAt=updated if template.status == "archived" else None,
        usageCount=template.usage_count,
        sections=[
            SectionResponse(
                id=section.id,
                title=section.title,
                description=section.description,
                order=section.order,
                questions=[
                    QuestionResponse(
                        id=question.id,
                        text=question.question_text,
                        type=question.type,
                        isRequired=question.is_required,
                        requirePhoto=question.require_photo,
                        requireJustification=question.require_justification,
                        order=question.order,
                    )
                    for question in section.questions
                ],
            )
            for section in template.sections
        ],
    )


def _apply_sections(
    template: ChecklistTemplateModel, sections: list[SectionPayload]
) -> None:
    template.sections.clear()
    for section_data in sections:
        section = ChecklistSectionModel(
            title=section_data.title.strip(),
            description=section_data.description,
            order=section_data.order,
        )
        section.questions = [
            ChecklistQuestionModel(
                question_text=question.text.strip(),
                type=question.type,
                is_required=question.isRequired,
                require_photo=question.requirePhoto,
                require_justification=question.requireJustification,
                order=question.order,
            )
            for question in section_data.questions
        ]
        template.sections.append(section)


def _statement():
    return select(ChecklistTemplateModel).options(
        selectinload(ChecklistTemplateModel.sections).selectinload(
            ChecklistSectionModel.questions
        )
    )


@router.get("", response_model=list[ChecklistResponse])
async def list_checklists(
    checklist_status: str | None = Query(default=None, alias="status"),
    session: AsyncSession = Depends(get_db),
) -> list[ChecklistResponse]:
    statement = _statement().order_by(ChecklistTemplateModel.updated_at.desc())
    if checklist_status:
        statement = statement.where(ChecklistTemplateModel.status == checklist_status)
    result = await session.execute(statement)
    return [_response(item) for item in result.scalars().unique().all()]


@router.get("/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    checklist_id: str, session: AsyncSession = Depends(get_db)
) -> ChecklistResponse:
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    return _response(template)


@router.post("", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist(
    payload: ChecklistPayload, session: AsyncSession = Depends(get_db)
) -> ChecklistResponse:
    template = ChecklistTemplateModel(
        template_family_id=f"tpl-{uuid4().hex[:8]}",
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description,
        status="draft",
        version=1,
        is_latest_version=True,
        created_by=payload.createdBy,
        usage_count=0,
    )
    _apply_sections(template, payload.sections)
    session.add(template)
    await session.commit()
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == template.id)
    )
    return _response(result.scalar_one())


@router.put("/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: str,
    payload: ChecklistPayload,
    session: AsyncSession = Depends(get_db),
) -> ChecklistResponse:
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    if template.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Somente rascunhos podem ser editados. Crie uma nova versão.",
        )
    template.title = payload.title.strip()
    template.category = payload.category.strip()
    template.description = payload.description
    _apply_sections(template, payload.sections)
    await session.commit()
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    return _response(result.scalar_one())


@router.post("/{checklist_id}/publish", response_model=ChecklistResponse)
async def publish_checklist(
    checklist_id: str, session: AsyncSession = Depends(get_db)
) -> ChecklistResponse:
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    if not template.sections or not any(s.questions for s in template.sections):
        raise HTTPException(
            status_code=422,
            detail="Inclua ao menos uma pergunta antes de publicar.",
        )
    template.status = "published"
    await session.commit()
    await session.refresh(template)
    return _response(template)


@router.post("/{checklist_id}/archive", response_model=ChecklistResponse)
async def archive_checklist(
    checklist_id: str, session: AsyncSession = Depends(get_db)
) -> ChecklistResponse:
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    template.status = "archived"
    await session.commit()
    await session.refresh(template)
    return _response(template)


@router.post("/{checklist_id}/duplicate", response_model=ChecklistResponse)
async def duplicate_checklist(
    checklist_id: str, session: AsyncSession = Depends(get_db)
) -> ChecklistResponse:
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == checklist_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    clone = ChecklistTemplateModel(
        template_family_id=f"tpl-{uuid4().hex[:8]}",
        title=f"Cópia de {source.title}",
        category=source.category,
        description=source.description,
        status="draft",
        version=1,
        is_latest_version=True,
        created_by=source.created_by,
        usage_count=0,
    )
    _apply_sections(
        clone,
        [
            SectionPayload(
                title=section.title,
                description=section.description,
                order=section.order,
                questions=[
                    QuestionPayload(
                        text=question.question_text,
                        type=question.type,
                        isRequired=question.is_required,
                        requirePhoto=question.require_photo,
                        requireJustification=question.require_justification,
                        order=question.order,
                    )
                    for question in section.questions
                ],
            )
            for section in source.sections
        ],
    )
    session.add(clone)
    await session.commit()
    result = await session.execute(
        _statement().where(ChecklistTemplateModel.id == clone.id)
    )
    return _response(result.scalar_one())


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist(
    checklist_id: str, session: AsyncSession = Depends(get_db)
) -> None:
    template = await session.get(ChecklistTemplateModel, checklist_id)
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    if template.status == "published" or template.usage_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Checklists publicados ou utilizados devem ser arquivados.",
        )
    await session.delete(template)
    await session.commit()

# ruff: noqa: N815

import base64
import binascii
import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.interfaces.storage import ReportStorage
from app.application.services.inspection_report import (
    InspectionReportData,
    ReportAnswer,
    ReportEvidence,
    ReportSignature,
    SignaturePoint,
    generate_inspection_report,
)
from app.core.auth import get_current_user
from app.infrastructure.database.models.apr_model import AprAssessmentModel
from app.infrastructure.database.models.checklist_model import (
    ChecklistSectionModel,
    ChecklistTechnicianAssignmentModel,
    ChecklistTemplateModel,
)
from app.infrastructure.database.models.incident_model import IncidentModel
from app.infrastructure.database.models.inspection_model import (
    EvidenceModel,
    InspectionAnswerModel,
    InspectionModel,
)
from app.infrastructure.database.models.report_model import InspectionReportModel
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.models.vehicle_model import VehicleModel
from app.infrastructure.database.session import get_db
from app.infrastructure.minio.report_storage import get_report_storage
from app.interfaces.api.v1.apr import CreateAprRequest, create_apr

router = APIRouter(prefix="/inspections", tags=["Inspeções & Sincronização"])
FIELD_TIMEZONE = ZoneInfo("America/Sao_Paulo")


def _execution_period(frequency: str) -> tuple[datetime, datetime] | None:
    if frequency == "ON_DEMAND":
        return None
    local_now = datetime.now(FIELD_TIMEZONE)
    start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    if frequency == "WEEKLY":
        start -= timedelta(days=start.weekday())
        end = start + timedelta(days=7)
    else:
        end = start + timedelta(days=1)
    return start.astimezone(UTC), end.astimezone(UTC)


class SyncItemRequest(BaseModel):
    id: str = Field(..., description="UUIDv4 gerado no cliente mobile")
    entityType: str = Field(..., description="INSPECTION | VEHICLE_CHECKLIST | APR")
    payload: dict[str, Any]
    createdAt: str
    status: str = "PENDING"


class SyncBatchRequest(BaseModel):
    items: list[SyncItemRequest]


class SyncItemResult(BaseModel):
    id: str
    status: str = "SYNCED"
    message: str


class SyncBatchResponse(BaseModel):
    syncedCount: int
    results: list[SyncItemResult]


class ReportAnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str
    value: str
    category: str = "Geral"
    notes: str | None = None


class ReportEvidenceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    capturedAt: str
    dataUrl: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class SignaturePointRequest(BaseModel):
    x: float
    y: float


class ReportSignatureRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signerName: str
    signedAt: str
    strokes: list[list[SignaturePointRequest]]


class GenerateInspectionReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    technicianName: str
    completedAt: str
    templateVersion: str
    vehiclePlate: str | None = None
    vehicleModel: str | None = None
    serviceOrderNumber: str | None = None
    notes: str | None = None
    answers: list[ReportAnswerRequest]
    evidences: list[ReportEvidenceRequest] = Field(default_factory=list)
    signature: ReportSignatureRequest


class InspectionReportResponse(BaseModel):
    reportId: str
    inspectionId: str
    objectKey: str
    sha256: str
    generatedAt: str
    downloadUrl: str | None = None


class AuditInspectionSummary(BaseModel):
    id: str
    title: str
    technicianName: str
    vehiclePlate: str | None = None
    completedAt: str
    answerCount: int
    evidenceCount: int


class AuditAnswer(BaseModel):
    questionId: str
    questionText: str
    answerValue: str


class AuditEvidence(BaseModel):
    id: str
    photoUrl: str
    capturedAt: str
    description: str | None = None


class AuditInspectionDetail(AuditInspectionSummary):
    notes: str | None = None
    answers: list[AuditAnswer]
    evidences: list[AuditEvidence]


class AuditNonconformityRequest(BaseModel):
    questionId: str = Field(min_length=1)
    description: str = Field(min_length=3)
    severity: str = "MEDIA"


class AuditPdfResponse(BaseModel):
    downloadUrl: str


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(UTC)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(UTC)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _decode_evidence(data_url: str) -> tuple[bytes, str, str]:
    try:
        header, encoded = data_url.split(",", 1)
        content_type = header.split(";", 1)[0].replace("data:", "")
        extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }.get(content_type)
        if not extension:
            raise ValueError("Formato de imagem não suportado.")
        content = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(
            status_code=422, detail="Evidência fotográfica inválida."
        ) from exc
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Cada evidência deve ter no máximo 8 MB."
        )
    return content, content_type, extension


def _ensure_audit_access(user: UserModel) -> None:
    if user.role == "TECNICO":
        raise HTTPException(status_code=403, detail="Acesso de auditoria restrito à gestão.")


async def _question_texts_for_inspection(
    session: AsyncSession, inspection: InspectionModel
) -> dict[str, str]:
    """Resolve a versão do checklist usada na vistoria, inclusive quando o mobile envia a família."""
    result = await session.execute(
        select(ChecklistTemplateModel)
        .options(
            selectinload(ChecklistTemplateModel.sections).selectinload(
                ChecklistSectionModel.questions
            )
        )
        .where(
            or_(
                ChecklistTemplateModel.id == inspection.template_id,
                ChecklistTemplateModel.template_family_id == inspection.template_id,
            )
        )
    )
    templates = result.scalars().unique().all()
    template = next(
        (
            item
            for item in templates
            if item.id == inspection.template_id
            or str(item.version) == str(inspection.template_version)
        ),
        None,
    )
    if not template and templates:
        template = templates[0]
    return {
        question.id: question.question_text
        for section in (template.sections if template else [])
        for question in section.questions
    }


@router.get("/audit", response_model=list[AuditInspectionSummary])
async def list_audit_inspections(
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[AuditInspectionSummary]:
    _ensure_audit_access(user)
    result = await session.execute(
        select(InspectionModel)
        .options(selectinload(InspectionModel.answers), selectinload(InspectionModel.evidences))
        .order_by(InspectionModel.completed_at.desc(), InspectionModel.created_at.desc())
        .limit(200)
    )
    return [
        AuditInspectionSummary(
            id=item.id,
            title=item.title,
            technicianName=item.technician_name,
            vehiclePlate=item.vehicle_plate,
            completedAt=(item.completed_at or item.created_at).isoformat(),
            answerCount=len(item.answers),
            evidenceCount=len(item.evidences),
        )
        for item in result.scalars().unique().all()
    ]


@router.get("/audit/{inspection_id}", response_model=AuditInspectionDetail)
async def get_audit_inspection(
    inspection_id: str,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> AuditInspectionDetail:
    _ensure_audit_access(user)
    result = await session.execute(
        select(InspectionModel)
        .options(selectinload(InspectionModel.answers), selectinload(InspectionModel.evidences))
        .where(InspectionModel.id == inspection_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist preenchido não encontrado.")
    question_texts = await _question_texts_for_inspection(session, item)
    return AuditInspectionDetail(
        id=item.id,
        title=item.title,
        technicianName=item.technician_name,
        vehiclePlate=item.vehicle_plate,
        completedAt=(item.completed_at or item.created_at).isoformat(),
        answerCount=len(item.answers),
        evidenceCount=len(item.evidences),
        notes=item.notes,
        answers=[
            AuditAnswer(
                questionId=answer.question_id,
                questionText=question_texts.get(answer.question_id, "Pergunta original indisponível"),
                answerValue=answer.answer_value,
            )
            for answer in item.answers
        ],
        evidences=[
            AuditEvidence(
                id=evidence.id,
                photoUrl=f"/inspections/audit/{item.id}/evidences/{evidence.id}",
                capturedAt=evidence.captured_at,
                description=evidence.description,
            )
            for evidence in item.evidences
        ],
    )


@router.get("/audit/{inspection_id}/evidences/{evidence_id}")
async def get_audit_evidence(
    inspection_id: str,
    evidence_id: str,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    storage: ReportStorage = Depends(get_report_storage),
) -> Response:
    """Entrega a foto via API para manter o MinIO privado na VPS."""
    _ensure_audit_access(user)
    evidence = await session.get(EvidenceModel, evidence_id)
    if not evidence or evidence.inspection_id != inspection_id:
        raise HTTPException(status_code=404, detail="Evidência fotográfica não encontrada.")
    content, content_type = await storage.download_bytes(evidence.photo_url)
    return Response(content=content, media_type=content_type)


@router.post("/audit/{inspection_id}/nonconformity")
async def create_audit_nonconformity(
    inspection_id: str,
    payload: AuditNonconformityRequest,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    _ensure_audit_access(user)
    inspection = await session.get(InspectionModel, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Checklist preenchido não encontrado.")
    answer = await session.scalar(
        select(InspectionAnswerModel).where(
            InspectionAnswerModel.inspection_id == inspection.id,
            InspectionAnswerModel.question_id == payload.questionId,
        )
    )
    if not answer:
        raise HTTPException(
            status_code=422,
            detail="A questão selecionada não pertence a este checklist.",
        )
    question_text = (
        (await _question_texts_for_inspection(session, inspection)).get(
            payload.questionId
        )
        or payload.questionId
    )
    incident = IncidentModel(
        code=f"NC-{datetime.now(UTC).year}-{uuid4().hex[:8].upper()}",
        inspection_id=inspection.id,
        inspection_title=inspection.title,
        context_type="AUDIT",
        vehicle_plate=inspection.vehicle_plate,
        vehicle_model=inspection.vehicle_model,
        technician_name=inspection.technician_name,
        team_name="Auditoria",
        question_text=question_text,
        category="Auditoria de checklist",
        severity=payload.severity,
        status="ABERTA",
        description=payload.description,
    )
    session.add(incident)
    await session.commit()
    return {"code": incident.code}


@router.post("/audit/{inspection_id}/pdf", response_model=AuditPdfResponse)
async def export_audit_pdf(
    inspection_id: str,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    storage: ReportStorage = Depends(get_report_storage),
) -> AuditPdfResponse:
    _ensure_audit_access(user)
    result = await session.execute(
        select(InspectionModel).options(selectinload(InspectionModel.answers), selectinload(InspectionModel.evidences)).where(InspectionModel.id == inspection_id)
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="Checklist preenchido não encontrado.")
    question_texts = await _question_texts_for_inspection(session, inspection)
    content = generate_inspection_report(InspectionReportData(
        inspection_id=inspection.id,
        title=inspection.title,
        technician_name=inspection.technician_name,
        completed_at=(inspection.completed_at or inspection.created_at).isoformat(),
        template_version=inspection.template_version,
        vehicle_plate=inspection.vehicle_plate,
        vehicle_model=inspection.vehicle_model,
        notes=inspection.notes,
        answers=[
            ReportAnswer(
                question=question_texts.get(answer.question_id, answer.question_id),
                value=answer.answer_value,
                notes=answer.notes,
            )
            for answer in inspection.answers
        ],
        evidences=[ReportEvidence(description=evidence.description or "Evidência fotográfica", captured_at=evidence.captured_at, latitude=evidence.latitude, longitude=evidence.longitude) for evidence in inspection.evidences],
    ))
    report_id = str(uuid4())
    object_key = f"reports/audits/{inspection.id}/{report_id}.pdf"
    await storage.upload_pdf(content, object_key)
    report = InspectionReportModel(
        id=report_id,
        inspection_id=inspection.id,
        object_key=object_key,
        sha256=hashlib.sha256(content).hexdigest(),
        generated_by=user.full_name,
    )
    session.add(report)
    await session.commit()
    return AuditPdfResponse(
        downloadUrl=f"/inspections/audit/{inspection.id}/reports/{report.id}/download"
    )


@router.get("/audit/{inspection_id}/reports/{report_id}/download")
async def download_audit_pdf(
    inspection_id: str,
    report_id: str,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    storage: ReportStorage = Depends(get_report_storage),
) -> Response:
    """Baixa o PDF pela API, sem publicar o MinIO."""
    _ensure_audit_access(user)
    report = await session.get(InspectionReportModel, report_id)
    if not report or report.inspection_id != inspection_id:
        raise HTTPException(status_code=404, detail="Relatório de auditoria não encontrado.")
    content, content_type = await storage.download_bytes(report.object_key)
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="checklist-{inspection_id}.pdf"'},
    )


@router.get("/mobile-context")
async def get_mobile_context(
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    vehicle_result = await session.execute(
        select(VehicleModel)
        .where(VehicleModel.assigned_technician_id == user.id)
        .order_by(VehicleModel.plate)
    )
    vehicles = vehicle_result.scalars().all()
    vehicle_template_ids = {
        vehicle.assigned_checklist_template_id
        for vehicle in vehicles
        if vehicle.assigned_checklist_template_id
    }
    assigned_template_ids = set(vehicle_template_ids)
    technician_assignments = (
        await session.execute(
            select(ChecklistTechnicianAssignmentModel).where(
                ChecklistTechnicianAssignmentModel.technician_id == user.id
            )
        )
    ).scalars().all()
    technician_template_ids = {
        assignment.template_id for assignment in technician_assignments
    }
    assigned_template_ids.update(technician_template_ids)

    checklist_result = await session.execute(
        select(ChecklistTemplateModel)
        .options(
            selectinload(ChecklistTemplateModel.sections).selectinload(
                ChecklistSectionModel.questions
            )
        )
        .where(ChecklistTemplateModel.status == "published")
        .where(
            (ChecklistTemplateModel.id.in_(assigned_template_ids))
            | (
                (ChecklistTemplateModel.distribution_scope == "CATEGORY")
                & (ChecklistTemplateModel.category == user.operational_category)
            )
        )
        .order_by(ChecklistTemplateModel.updated_at.desc())
    )
    checklists = checklist_result.scalars().unique().all()

    inspection_result = await session.execute(
        select(InspectionModel)
        .where(
            (InspectionModel.technician_id == user.id)
            | (
                (InspectionModel.technician_id.is_(None))
                & (InspectionModel.technician_name == user.full_name)
            )
        )
        .order_by(InspectionModel.created_at.desc())
        .limit(50)
    )
    inspections = inspection_result.scalars().all()
    def completion_in_current_period(template_id: str, frequency: str) -> str | None:
        period = _execution_period(frequency)
        if period is None:
            return None
        period_start, period_end = period
        return next(
            (
                inspection.completed_at.isoformat()
                for inspection in inspections
                if inspection.template_id == template_id
                and inspection.status == "COMPLETED"
                and inspection.completed_at is not None
                and period_start <= inspection.completed_at < period_end
            ),
            None,
        )

    completion_at_by_template_id = {
        checklist.id: completion_in_current_period(
            checklist.id, checklist.frequency
        )
        for checklist in checklists
    }

    apr_result = await session.execute(
        select(AprAssessmentModel)
        .where(AprAssessmentModel.technician_id == user.id)
        .order_by(AprAssessmentModel.created_at.desc())
        .limit(50)
    )
    aprs = apr_result.scalars().all()

    return {
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
            "employeeCode": user.employee_code,
            "phone": user.phone,
            "teamName": user.team_name,
            "specialty": user.specialty,
        },
        "vehicles": [
            {
                "id": vehicle.id,
                "model": vehicle.model,
                "plate": vehicle.plate,
                "year": vehicle.year,
                "currentKm": vehicle.current_km,
                "category": vehicle.category,
                "status": vehicle.status,
                "assignedChecklistTemplateId": (
                    vehicle.assigned_checklist_template_id
                ),
            }
            for vehicle in vehicles
        ],
        "checklists": [
            {
                "id": checklist.id,
                "templateId": checklist.template_family_id,
                "templateVersion": checklist.version,
                "title": checklist.title,
                "category": checklist.category,
                "description": checklist.description,
                "contextType": (
                    "APR"
                    if "APR" in checklist.category.upper()
                    or "RISCO" in checklist.title.upper()
                    else (
                        "VEHICLE"
                        if checklist.id in vehicle_template_ids
                        else "INDIVIDUAL"
                    )
                ),
                "isRequired": (
                    checklist.id in assigned_template_ids
                    or checklist.distribution_scope == "CATEGORY"
                ),
                "frequency": checklist.frequency,
                "state": (
                    "COMPLETED"
                    if completion_at_by_template_id[checklist.id] is not None
                    else "PENDING"
                ),
                "completedAt": completion_at_by_template_id[checklist.id],
                "estimatedMinutes": max(
                    5,
                    sum(
                        len(section.questions)
                        for section in checklist.sections
                    )
                    * 2,
                ),
                "questions": [
                    {
                        "id": question.id,
                        "category": section.title,
                        "questionText": question.question_text,
                        "type": question.type,
                        "isRequired": question.is_required,
                        "requirePhoto": question.require_photo,
                        "requireJustification": (
                            question.require_justification
                        ),
                        "options": question.options or [],
                    }
                    for section in sorted(
                        checklist.sections, key=lambda item: item.order
                    )
                    for question in sorted(
                        section.questions, key=lambda item: item.order
                    )
                ],
                "answers": {},
                "evidences": [],
            }
            for checklist in checklists
        ],
        "history": [
            {
                "id": inspection.id,
                "clientGeneratedId": inspection.client_generated_id,
                "title": inspection.title,
                "vehiclePlate": inspection.vehicle_plate,
                "vehicleModel": inspection.vehicle_model,
                "status": inspection.status,
                "completedAt": (
                    inspection.completed_at or inspection.created_at
                ).isoformat(),
            }
            for inspection in inspections
        ],
        "aprs": [
            {
                "id": apr.id,
                "clientGeneratedId": apr.client_generated_id,
                "serviceOrderNumber": apr.service_order_number,
                "activityType": apr.activity_type,
                "location": apr.location,
                "plannedStart": apr.planned_start,
                "status": apr.status,
                "canStartActivity": apr.can_start_activity,
                "maximumResidualRiskLevel": apr.maximum_residual_risk_level,
            }
            for apr in aprs
        ],
    }


async def _persist_inspection(
    item: SyncItemRequest,
    user: UserModel,
    session: AsyncSession,
    storage: ReportStorage,
) -> InspectionModel:
    payload = item.payload
    template_id = str(payload.get("templateId") or payload.get("id") or "")
    vehicle_id = payload.get("vehicleId")
    if vehicle_id and user.role == "TECNICO":
        assigned_vehicle = await session.scalar(
            select(VehicleModel).where(
                VehicleModel.id == vehicle_id,
                VehicleModel.assigned_technician_id == user.id,
            )
        )
        if not assigned_vehicle:
            raise HTTPException(
                status_code=403,
                detail="O veículo informado não está atribuído ao técnico autenticado.",
            )

    template = await session.get(ChecklistTemplateModel, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Checklist não encontrado.")
    period = _execution_period(template.frequency)
    completed_in_period = None
    if period is not None:
        completed_in_period = await session.scalar(
            select(InspectionModel.id).where(
                InspectionModel.technician_id == user.id,
                InspectionModel.template_id == template_id,
                InspectionModel.status == "COMPLETED",
                InspectionModel.completed_at >= period[0],
                InspectionModel.completed_at < period[1],
            )
        )
    if completed_in_period:
        raise HTTPException(
            status_code=409,
            detail="Este checklist já foi concluído no período atual.",
        )

    inspection = InspectionModel(
        client_generated_id=item.id,
        template_id=template_id,
        template_version=str(payload.get("templateVersion") or "1"),
        title=str(payload.get("title") or "Inspeção operacional"),
        vehicle_id=vehicle_id,
        vehicle_plate=payload.get("vehiclePlate"),
        vehicle_model=payload.get("vehicleModel"),
        technician_id=user.id,
        technician_name=user.full_name,
        status="COMPLETED",
        notes=payload.get("notes"),
        completed_at=_parse_datetime(
            payload.get("completedAt") or item.createdAt
        ),
    )
    session.add(inspection)
    await session.flush()

    questions = payload.get("questions") or []
    answers = payload.get("answers") or {}
    justifications = payload.get("justifications") or {}
    question_by_id = {
        str(question.get("id")): question
        for question in questions
        if question.get("id")
    }
    for question_id, answer in answers.items():
        session.add(
            InspectionAnswerModel(
                inspection_id=inspection.id,
                question_id=str(question_id),
                answer_value=str(answer),
                notes=justifications.get(str(question_id)),
            )
        )
        if answer != "NAO_CONFORME":
            continue
        question = question_by_id.get(str(question_id), {})
        category = str(question.get("category") or "Geral")
        justification = str(justifications.get(str(question_id)) or "").strip()
        session.add(
            IncidentModel(
                code=(
                    f"NC-{datetime.now(UTC).strftime('%Y%m')}-"
                    f"{uuid4().hex[:8].upper()}"
                ),
                inspection_id=inspection.id,
                inspection_title=inspection.title,
                context_type="VEHICLE" if vehicle_id else "INDIVIDUAL",
                vehicle_plate=inspection.vehicle_plate,
                vehicle_model=inspection.vehicle_model,
                technician_name=user.full_name,
                team_name=user.team_name or "Sem equipe",
                category=category,
                question_text=str(
                    question.get("questionText")
                    or question.get("text")
                    or "Item não conforme"
                ),
                severity=(
                    "ALTA"
                    if any(
                        term in category.lower()
                        for term in ("pneu", "freio", "segurança")
                    )
                    else "MEDIA"
                ),
                status="ABERTA",
                description=(
                    justification
                    or "Detectado automaticamente na inspeção mobile."
                ),
            )
        )

    for evidence in payload.get("evidences") or []:
        data_url = evidence.get("dataUrl")
        if not data_url:
            continue
        content, content_type, extension = _decode_evidence(data_url)
        evidence_id = str(evidence.get("id") or uuid4())
        object_key = (
            f"evidences/inspections/{inspection.id}/{evidence_id}.{extension}"
        )
        await storage.upload_bytes(content, object_key, content_type)
        session.add(
            EvidenceModel(
                inspection_id=inspection.id,
                photo_url=object_key,
                captured_at=str(evidence.get("capturedAt") or item.createdAt),
                latitude=evidence.get("latitude"),
                longitude=evidence.get("longitude"),
                description=evidence.get("description"),
                content_type=content_type,
                sha256=hashlib.sha256(content).hexdigest(),
            )
        )
    return inspection


@router.post(
    "/sync",
    response_model=SyncBatchResponse,
    summary="Recepção e conciliação idempotente de registros offline",
)
async def sync_offline_inspections(
    batch: SyncBatchRequest,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    storage: ReportStorage = Depends(get_report_storage),
) -> SyncBatchResponse:
    results: list[SyncItemResult] = []
    synced_count = 0

    for item in batch.items:
        try:
            if item.entityType == "APR":
                existing_apr = await session.scalar(
                    select(AprAssessmentModel).where(
                        AprAssessmentModel.client_generated_id == item.id
                    )
                )
                if existing_apr:
                    message = "APR já sincronizada anteriormente."
                else:
                    apr_payload = dict(item.payload)
                    apr_payload["clientGeneratedId"] = item.id
                    await create_apr(
                        CreateAprRequest.model_validate(apr_payload), session
                    )
                    synced_count += 1
                    message = "APR sincronizada e enviada para autorização."
            elif item.entityType in {"INSPECTION", "VEHICLE_CHECKLIST"}:
                existing_inspection = await session.scalar(
                    select(InspectionModel).where(
                        InspectionModel.client_generated_id == item.id
                    )
                )
                if existing_inspection:
                    message = (
                        "Vistoria já sincronizada anteriormente (Idempotente)."
                    )
                else:
                    await _persist_inspection(item, user, session, storage)
                    await session.commit()
                    synced_count += 1
                    message = "Vistoria sincronizada e persistida com sucesso."
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Tipo de registro não suportado: {item.entityType}.",
                )
            results.append(
                SyncItemResult(id=item.id, status="SYNCED", message=message)
            )
        except HTTPException:
            await session.rollback()
            raise
        except Exception as exc:
            await session.rollback()
            raise HTTPException(
                status_code=503,
                detail=f"Não foi possível sincronizar o registro {item.id}.",
            ) from exc

    return SyncBatchResponse(syncedCount=synced_count, results=results)


@router.post(
    "/{inspection_id}/report",
    response_model=InspectionReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Geração e armazenamento do laudo oficial da vistoria",
)
async def generate_report(
    inspection_id: str,
    request: GenerateInspectionReportRequest,
    user: UserModel = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    storage_service: ReportStorage = Depends(get_report_storage),
) -> InspectionReportResponse:
    report_data = InspectionReportData(
        inspection_id=inspection_id,
        title=request.title,
        technician_name=request.technicianName,
        completed_at=request.completedAt,
        template_version=request.templateVersion,
        vehicle_plate=request.vehiclePlate,
        vehicle_model=request.vehicleModel,
        service_order_number=request.serviceOrderNumber,
        notes=request.notes,
        answers=[
            ReportAnswer(
                question=answer.question,
                value=answer.value,
                category=answer.category,
                notes=answer.notes,
            )
            for answer in request.answers
        ],
        evidences=[
            ReportEvidence(
                description=evidence.description,
                captured_at=evidence.capturedAt,
                data_url=evidence.dataUrl,
                latitude=evidence.latitude,
                longitude=evidence.longitude,
            )
            for evidence in request.evidences
        ],
        signature=ReportSignature(
            signer_name=request.signature.signerName,
            signed_at=request.signature.signedAt,
            strokes=[
                [SignaturePoint(x=point.x, y=point.y) for point in stroke]
                for stroke in request.signature.strokes
            ],
        ),
    )
    pdf_content = generate_inspection_report(report_data)
    report_id = str(uuid4())
    generated_at = datetime.now(UTC)
    object_key = f"reports/inspections/{inspection_id}/{report_id}.pdf"
    digest = hashlib.sha256(pdf_content).hexdigest()

    try:
        await storage_service.upload_pdf(pdf_content, object_key)
        download_url = await storage_service.generate_download_url(object_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O laudo foi gerado, mas o armazenamento está indisponível.",
        ) from exc

    report = InspectionReportModel(
        id=report_id,
        inspection_id=inspection_id,
        object_key=object_key,
        sha256=digest,
        generated_by=user.full_name,
    )
    session.add(report)
    await session.commit()
    return InspectionReportResponse(
        reportId=report.id,
        inspectionId=report.inspection_id,
        objectKey=report.object_key,
        sha256=report.sha256,
        generatedAt=generated_at.isoformat(),
        downloadUrl=download_url,
    )


@router.get(
    "/reports/{report_id}",
    response_model=InspectionReportResponse,
    summary="Consulta dos metadados de um laudo oficial",
)
async def get_report(
    report_id: str,
    session: AsyncSession = Depends(get_db),
    storage_service: ReportStorage = Depends(get_report_storage),
) -> InspectionReportResponse:
    report = await session.get(InspectionReportModel, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Laudo não encontrado.")
    return InspectionReportResponse(
        reportId=report.id,
        inspectionId=report.inspection_id,
        objectKey=report.object_key,
        sha256=report.sha256,
        generatedAt=report.created_at.isoformat(),
        downloadUrl=await storage_service.generate_download_url(report.object_key),
    )

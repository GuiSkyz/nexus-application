# ruff: noqa: N815

import json
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.risk_matrix import RiskLevel, calculate_risk
from app.infrastructure.database.models.apr_model import AprAssessmentModel, AprRiskModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/apr", tags=["Análise Preliminar de Risco"])

AprStatus = Literal[
    "DRAFT", "PENDING_AUTHORIZATION", "AUTHORIZED", "REJECTED", "CANCELLED"
]


class SignaturePointRequest(BaseModel):
    x: float
    y: float


class DigitalSignatureRequest(BaseModel):
    signerName: str
    signedAt: str
    strokes: list[list[SignaturePointRequest]]


class AprRiskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    hazard: str = Field(min_length=3)
    probability: int = Field(ge=1, le=5)
    severity: int = Field(ge=1, le=5)
    controls: list[str] = Field(min_length=1)
    residualProbability: int = Field(ge=1, le=5)
    residualSeverity: int = Field(ge=1, le=5)

    @model_validator(mode="after")
    def validate_residual_risk(self) -> "AprRiskRequest":
        initial = calculate_risk(self.probability, self.severity)
        residual = calculate_risk(self.residualProbability, self.residualSeverity)
        if residual.score > initial.score:
            raise ValueError("O risco residual não pode ser maior que o risco inicial.")
        return self


class CreateAprRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clientGeneratedId: str
    serviceOrderNumber: str
    activityId: str
    activityType: Literal["NR10", "NR35", "ESPACO_CONFINADO", "REDE_EXTERNA", "OUTRA"]
    location: str
    technicianId: str
    technicianName: str
    teamName: str
    plannedStart: str
    requiredPpe: list[str] = Field(min_length=1)
    weatherConditions: str
    emergencyContact: str
    risks: list[AprRiskRequest] = Field(min_length=1)
    technicianSignature: DigitalSignatureRequest


class SupervisorDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    supervisorId: str
    supervisorName: str
    notes: str = Field(min_length=3)
    signature: DigitalSignatureRequest


class RiskAssessmentResponse(BaseModel):
    hazard: str
    probability: int
    severity: int
    score: int
    level: RiskLevel
    controls: list[str]
    residualProbability: int
    residualSeverity: int
    residualScore: int
    residualLevel: RiskLevel


class AprAuditEvent(BaseModel):
    event: str
    actor: str
    occurredAt: str
    notes: str | None = None


class AprResponse(BaseModel):
    id: str
    clientGeneratedId: str
    serviceOrderNumber: str
    activityId: str
    activityType: str
    location: str
    technicianId: str
    technicianName: str
    teamName: str
    plannedStart: str
    requiredPpe: list[str]
    weatherConditions: str
    emergencyContact: str
    risks: list[RiskAssessmentResponse]
    maximumRiskLevel: RiskLevel
    maximumResidualRiskLevel: RiskLevel
    status: AprStatus
    canStartActivity: bool
    technicianSignature: DigitalSignatureRequest
    supervisorSignature: DigitalSignatureRequest | None = None
    authorizedBy: str | None = None
    authorizedAt: str | None = None
    authorizationNotes: str | None = None
    auditTrail: list[AprAuditEvent]


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _highest_level(levels: list[RiskLevel]) -> RiskLevel:
    order = {RiskLevel.BAIXO: 1, RiskLevel.MEDIO: 2, RiskLevel.ALTO: 3, RiskLevel.CRITICO: 4}
    return max(levels, key=order.get)


def _risk_response(risk: AprRiskModel) -> RiskAssessmentResponse:
    return RiskAssessmentResponse(
        hazard=risk.hazard,
        probability=risk.probability,
        severity=risk.severity,
        score=risk.score,
        level=RiskLevel(risk.level),
        controls=json.loads(risk.controls),
        residualProbability=risk.residual_probability,
        residualSeverity=risk.residual_severity,
        residualScore=risk.residual_score,
        residualLevel=RiskLevel(risk.residual_level),
    )


async def _response(
    assessment: AprAssessmentModel, session: AsyncSession
) -> AprResponse:
    result = await session.execute(
        select(AprRiskModel)
        .where(AprRiskModel.apr_id == assessment.id)
        .order_by(AprRiskModel.created_at)
    )
    risks = [_risk_response(risk) for risk in result.scalars().all()]
    return AprResponse(
        id=assessment.id,
        clientGeneratedId=assessment.client_generated_id,
        serviceOrderNumber=assessment.service_order_number,
        activityId=assessment.activity_id,
        activityType=assessment.activity_type,
        location=assessment.location,
        technicianId=assessment.technician_id,
        technicianName=assessment.technician_name,
        teamName=assessment.team_name,
        plannedStart=assessment.planned_start,
        requiredPpe=json.loads(assessment.required_ppe_json),
        weatherConditions=assessment.weather_conditions,
        emergencyContact=assessment.emergency_contact,
        risks=risks,
        maximumRiskLevel=RiskLevel(assessment.maximum_risk_level),
        maximumResidualRiskLevel=RiskLevel(assessment.maximum_residual_risk_level),
        status=assessment.status,
        canStartActivity=assessment.can_start_activity,
        technicianSignature=DigitalSignatureRequest.model_validate_json(
            assessment.technician_signature_json
        ),
        supervisorSignature=(
            DigitalSignatureRequest.model_validate_json(
                assessment.supervisor_signature_json
            )
            if assessment.supervisor_signature_json
            else None
        ),
        authorizedBy=assessment.authorized_by,
        authorizedAt=assessment.authorized_at,
        authorizationNotes=assessment.authorization_notes,
        auditTrail=[
            AprAuditEvent.model_validate(item)
            for item in json.loads(assessment.audit_trail_json)
        ],
    )


async def _apply_payload(
    assessment: AprAssessmentModel,
    request: CreateAprRequest,
    session: AsyncSession,
) -> None:
    risk_rows: list[AprRiskModel] = []
    initial_levels: list[RiskLevel] = []
    residual_levels: list[RiskLevel] = []
    for risk in request.risks:
        initial = calculate_risk(risk.probability, risk.severity)
        residual = calculate_risk(risk.residualProbability, risk.residualSeverity)
        initial_levels.append(initial.level)
        residual_levels.append(residual.level)
        risk_rows.append(
            AprRiskModel(
                apr_id=assessment.id,
                hazard=risk.hazard,
                probability=risk.probability,
                severity=risk.severity,
                score=initial.score,
                level=initial.level.value,
                controls=json.dumps(risk.controls, ensure_ascii=False),
                residual_probability=risk.residualProbability,
                residual_severity=risk.residualSeverity,
                residual_score=residual.score,
                residual_level=residual.level.value,
            )
        )
    assessment.client_generated_id = request.clientGeneratedId
    assessment.service_order_number = request.serviceOrderNumber
    assessment.activity_id = request.activityId
    assessment.activity_type = request.activityType
    assessment.location = request.location
    assessment.technician_id = request.technicianId
    assessment.technician_name = request.technicianName
    assessment.team_name = request.teamName
    assessment.planned_start = request.plannedStart
    assessment.maximum_risk_level = _highest_level(initial_levels).value
    assessment.maximum_residual_risk_level = _highest_level(residual_levels).value
    assessment.hazards_json = json.dumps(
        [risk.hazard for risk in request.risks], ensure_ascii=False
    )
    assessment.required_ppe_json = json.dumps(request.requiredPpe, ensure_ascii=False)
    assessment.weather_conditions = request.weatherConditions
    assessment.emergency_contact = request.emergencyContact
    assessment.technician_signature_json = request.technicianSignature.model_dump_json()
    await session.execute(delete(AprRiskModel).where(AprRiskModel.apr_id == assessment.id))
    session.add_all(risk_rows)


@router.post("", response_model=AprResponse, status_code=status.HTTP_201_CREATED)
async def create_apr(
    request: CreateAprRequest, session: AsyncSession = Depends(get_db)
) -> AprResponse:
    existing = await session.scalar(
        select(AprAssessmentModel).where(
            AprAssessmentModel.client_generated_id == request.clientGeneratedId
        )
    )
    if existing:
        return await _response(existing, session)
    event = AprAuditEvent(
        event="SUBMITTED_FOR_AUTHORIZATION",
        actor=request.technicianName,
        occurredAt=_now(),
        notes="APR preenchida e assinada pelo técnico.",
    )
    assessment = AprAssessmentModel(
        client_generated_id=request.clientGeneratedId,
        service_order_number=request.serviceOrderNumber,
        activity_id=request.activityId,
        activity_type=request.activityType,
        location=request.location,
        technician_id=request.technicianId,
        technician_name=request.technicianName,
        team_name=request.teamName,
        planned_start=request.plannedStart,
        status="PENDING_AUTHORIZATION",
        maximum_risk_level="BAIXO",
        maximum_residual_risk_level="BAIXO",
        hazards_json="[]",
        required_ppe_json="[]",
        technician_signature_json=request.technicianSignature.model_dump_json(),
        weather_conditions=request.weatherConditions,
        emergency_contact=request.emergencyContact,
        audit_trail_json=json.dumps([event.model_dump()], ensure_ascii=False),
        can_start_activity=False,
    )
    session.add(assessment)
    await session.flush()
    await _apply_payload(assessment, request, session)
    await session.commit()
    await session.refresh(assessment)
    return await _response(assessment, session)


@router.get("", response_model=list[AprResponse])
async def list_aprs(
    apr_status: AprStatus | None = Query(default=None, alias="status"),
    session: AsyncSession = Depends(get_db),
) -> list[AprResponse]:
    statement = select(AprAssessmentModel).order_by(
        AprAssessmentModel.created_at.desc()
    )
    if apr_status:
        statement = statement.where(AprAssessmentModel.status == apr_status)
    result = await session.execute(statement)
    return [await _response(item, session) for item in result.scalars().all()]


@router.get("/{apr_id}", response_model=AprResponse)
async def get_apr(
    apr_id: str, session: AsyncSession = Depends(get_db)
) -> AprResponse:
    assessment = await session.get(AprAssessmentModel, apr_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    return await _response(assessment, session)


@router.put("/{apr_id}", response_model=AprResponse)
async def update_apr(
    apr_id: str,
    request: CreateAprRequest,
    session: AsyncSession = Depends(get_db),
) -> AprResponse:
    assessment = await session.get(AprAssessmentModel, apr_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    if assessment.status == "AUTHORIZED":
        raise HTTPException(status_code=409, detail="APR autorizada não pode ser alterada.")
    await _apply_payload(assessment, request, session)
    assessment.status = "PENDING_AUTHORIZATION"
    assessment.can_start_activity = False
    assessment.authorized_by = None
    assessment.authorized_at = None
    assessment.authorization_notes = None
    assessment.supervisor_signature_json = None
    events = json.loads(assessment.audit_trail_json)
    events.append(
        AprAuditEvent(
            event="RESUBMITTED",
            actor=request.technicianName,
            occurredAt=_now(),
            notes="APR revisada e reenviada.",
        ).model_dump()
    )
    assessment.audit_trail_json = json.dumps(events, ensure_ascii=False)
    await session.commit()
    await session.refresh(assessment)
    return await _response(assessment, session)


async def _decision(
    apr_id: str,
    request: SupervisorDecisionRequest,
    decision: Literal["AUTHORIZED", "REJECTED"],
    session: AsyncSession,
) -> AprResponse:
    assessment = await session.get(AprAssessmentModel, apr_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    if assessment.status != "PENDING_AUTHORIZATION":
        raise HTTPException(status_code=409, detail="A APR não está pendente.")
    if decision == "AUTHORIZED" and assessment.maximum_residual_risk_level == "CRITICO":
        raise HTTPException(
            status_code=422,
            detail="Risco residual crítico: revise os controles antes da autorização.",
        )
    occurred_at = _now()
    assessment.status = decision
    assessment.can_start_activity = decision == "AUTHORIZED"
    assessment.supervisor_signature_json = request.signature.model_dump_json()
    assessment.authorized_by = request.supervisorName
    assessment.authorized_at = occurred_at
    assessment.authorization_notes = request.notes
    events = json.loads(assessment.audit_trail_json)
    events.append(
        AprAuditEvent(
            event=decision,
            actor=request.supervisorName,
            occurredAt=occurred_at,
            notes=request.notes,
        ).model_dump()
    )
    assessment.audit_trail_json = json.dumps(events, ensure_ascii=False)
    await session.commit()
    await session.refresh(assessment)
    return await _response(assessment, session)


@router.post("/{apr_id}/authorize", response_model=AprResponse)
async def authorize_apr(
    apr_id: str,
    request: SupervisorDecisionRequest,
    session: AsyncSession = Depends(get_db),
) -> AprResponse:
    return await _decision(apr_id, request, "AUTHORIZED", session)


@router.post("/{apr_id}/reject", response_model=AprResponse)
async def reject_apr(
    apr_id: str,
    request: SupervisorDecisionRequest,
    session: AsyncSession = Depends(get_db),
) -> AprResponse:
    return await _decision(apr_id, request, "REJECTED", session)


@router.delete("/{apr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_apr(
    apr_id: str, session: AsyncSession = Depends(get_db)
) -> None:
    assessment = await session.get(AprAssessmentModel, apr_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    if assessment.status == "AUTHORIZED":
        raise HTTPException(
            status_code=409, detail="APR autorizada deve ser preservada para auditoria."
        )
    await session.execute(delete(AprRiskModel).where(AprRiskModel.apr_id == apr_id))
    await session.delete(assessment)
    await session.commit()

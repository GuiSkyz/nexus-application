from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.application.services.risk_matrix import RiskLevel, calculate_risk

router = APIRouter(prefix="/apr", tags=["Análise Preliminar de Risco"])

AprStatus = Literal[
    "DRAFT",
    "PENDING_AUTHORIZATION",
    "AUTHORIZED",
    "REJECTED",
    "CANCELLED",
]


class SignaturePointRequest(BaseModel):
    x: float
    y: float


class DigitalSignatureRequest(BaseModel):
    signerName: str
    signedAt: str
    strokes: List[List[SignaturePointRequest]]


class AprRiskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hazard: str = Field(min_length=3)
    probability: int = Field(ge=1, le=5)
    severity: int = Field(ge=1, le=5)
    controls: List[str] = Field(min_length=1)
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
    requiredPpe: List[str] = Field(min_length=1)
    weatherConditions: str
    emergencyContact: str
    risks: List[AprRiskRequest] = Field(min_length=1)
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
    controls: List[str]
    residualProbability: int
    residualSeverity: int
    residualScore: int
    residualLevel: RiskLevel


class AprAuditEvent(BaseModel):
    event: str
    actor: str
    occurredAt: str
    notes: Optional[str] = None


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
    requiredPpe: List[str]
    weatherConditions: str
    emergencyContact: str
    risks: List[RiskAssessmentResponse]
    maximumRiskLevel: RiskLevel
    maximumResidualRiskLevel: RiskLevel
    status: AprStatus
    canStartActivity: bool
    technicianSignature: DigitalSignatureRequest
    supervisorSignature: Optional[DigitalSignatureRequest] = None
    authorizedBy: Optional[str] = None
    authorizedAt: Optional[str] = None
    authorizationNotes: Optional[str] = None
    auditTrail: List[AprAuditEvent]


apr_store: Dict[str, AprResponse] = {}
apr_client_ids: Dict[str, str] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _highest_level(levels: List[RiskLevel]) -> RiskLevel:
    order = {
        RiskLevel.BAIXO: 1,
        RiskLevel.MEDIO: 2,
        RiskLevel.ALTO: 3,
        RiskLevel.CRITICO: 4,
    }
    return max(levels, key=order.get)


@router.post(
    "",
    response_model=AprResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma APR e solicita autorização do supervisor",
)
async def create_apr(request: CreateAprRequest) -> AprResponse:
    existing_id = apr_client_ids.get(request.clientGeneratedId)
    if existing_id:
        return apr_store[existing_id]

    risks = []
    for risk in request.risks:
        initial = calculate_risk(risk.probability, risk.severity)
        residual = calculate_risk(risk.residualProbability, risk.residualSeverity)
        risks.append(
            RiskAssessmentResponse(
                hazard=risk.hazard,
                probability=risk.probability,
                severity=risk.severity,
                score=initial.score,
                level=initial.level,
                controls=risk.controls,
                residualProbability=risk.residualProbability,
                residualSeverity=risk.residualSeverity,
                residualScore=residual.score,
                residualLevel=residual.level,
            )
        )

    apr_id = str(uuid4())
    created_at = _now()
    response = AprResponse(
        id=apr_id,
        clientGeneratedId=request.clientGeneratedId,
        serviceOrderNumber=request.serviceOrderNumber,
        activityId=request.activityId,
        activityType=request.activityType,
        location=request.location,
        technicianId=request.technicianId,
        technicianName=request.technicianName,
        teamName=request.teamName,
        plannedStart=request.plannedStart,
        requiredPpe=request.requiredPpe,
        weatherConditions=request.weatherConditions,
        emergencyContact=request.emergencyContact,
        risks=risks,
        maximumRiskLevel=_highest_level([risk.level for risk in risks]),
        maximumResidualRiskLevel=_highest_level([risk.residualLevel for risk in risks]),
        status="PENDING_AUTHORIZATION",
        canStartActivity=False,
        technicianSignature=request.technicianSignature,
        auditTrail=[
            AprAuditEvent(
                event="SUBMITTED_FOR_AUTHORIZATION",
                actor=request.technicianName,
                occurredAt=created_at,
                notes="APR preenchida e assinada pelo técnico.",
            )
        ],
    )
    apr_store[apr_id] = response
    apr_client_ids[request.clientGeneratedId] = apr_id
    return response


@router.get("", response_model=List[AprResponse], summary="Lista APRs")
async def list_aprs(
    apr_status: Optional[AprStatus] = Query(default=None, alias="status"),
) -> List[AprResponse]:
    aprs = list(apr_store.values())
    if apr_status:
        aprs = [apr for apr in aprs if apr.status == apr_status]
    return aprs


@router.get("/{apr_id}", response_model=AprResponse, summary="Consulta uma APR")
async def get_apr(apr_id: str) -> AprResponse:
    apr = apr_store.get(apr_id)
    if apr is None:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    return apr


@router.post(
    "/{apr_id}/authorize",
    response_model=AprResponse,
    summary="Autoriza digitalmente o início da atividade",
)
async def authorize_apr(
    apr_id: str,
    request: SupervisorDecisionRequest,
) -> AprResponse:
    apr = apr_store.get(apr_id)
    if apr is None:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    if apr.status != "PENDING_AUTHORIZATION":
        raise HTTPException(
            status_code=409,
            detail="Somente APRs pendentes podem ser autorizadas.",
        )
    if apr.maximumResidualRiskLevel == RiskLevel.CRITICO:
        raise HTTPException(
            status_code=422,
            detail="Risco residual crítico: revise os controles antes da autorização.",
        )

    authorized_at = _now()
    updated = apr.model_copy(
        update={
            "status": "AUTHORIZED",
            "canStartActivity": True,
            "supervisorSignature": request.signature,
            "authorizedBy": request.supervisorName,
            "authorizedAt": authorized_at,
            "authorizationNotes": request.notes,
            "auditTrail": [
                *apr.auditTrail,
                AprAuditEvent(
                    event="AUTHORIZED",
                    actor=request.supervisorName,
                    occurredAt=authorized_at,
                    notes=request.notes,
                ),
            ],
        }
    )
    apr_store[apr_id] = updated
    return updated


@router.post(
    "/{apr_id}/reject",
    response_model=AprResponse,
    summary="Rejeita a APR e mantém a atividade bloqueada",
)
async def reject_apr(
    apr_id: str,
    request: SupervisorDecisionRequest,
) -> AprResponse:
    apr = apr_store.get(apr_id)
    if apr is None:
        raise HTTPException(status_code=404, detail="APR não encontrada.")
    if apr.status != "PENDING_AUTHORIZATION":
        raise HTTPException(
            status_code=409,
            detail="Somente APRs pendentes podem ser rejeitadas.",
        )

    rejected_at = _now()
    updated = apr.model_copy(
        update={
            "status": "REJECTED",
            "canStartActivity": False,
            "supervisorSignature": request.signature,
            "authorizedBy": request.supervisorName,
            "authorizedAt": rejected_at,
            "authorizationNotes": request.notes,
            "auditTrail": [
                *apr.auditTrail,
                AprAuditEvent(
                    event="REJECTED",
                    actor=request.supervisorName,
                    occurredAt=rejected_at,
                    notes=request.notes,
                ),
            ],
        }
    )
    apr_store[apr_id] = updated
    return updated

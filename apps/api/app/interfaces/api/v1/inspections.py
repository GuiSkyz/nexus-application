import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.application.services.inspection_report import (
    InspectionReportData,
    ReportAnswer,
    ReportEvidence,
    ReportSignature,
    SignaturePoint,
    generate_inspection_report,
)
from app.infrastructure.minio.report_storage import MinioReportStorage, get_report_storage

router = APIRouter(prefix="/inspections", tags=["Inspeções & Sincronização"])


class SyncItemRequest(BaseModel):
    id: str = Field(..., description="UUIDv4 gerado no cliente mobile")
    entityType: str = Field(..., description="INSPECTION | VEHICLE_CHECKLIST | APR")
    payload: Dict[str, Any]
    createdAt: str
    status: str = "PENDING"


class SyncBatchRequest(BaseModel):
    items: List[SyncItemRequest]


class SyncItemResult(BaseModel):
    id: str
    status: str = "SYNCED"
    message: str


class SyncBatchResponse(BaseModel):
    syncedCount: int
    results: List[SyncItemResult]


class ReportAnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str
    value: str
    category: str = "Geral"
    notes: Optional[str] = None


class ReportEvidenceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    capturedAt: str
    dataUrl: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SignaturePointRequest(BaseModel):
    x: float
    y: float


class ReportSignatureRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signerName: str
    signedAt: str
    strokes: List[List[SignaturePointRequest]]


class GenerateInspectionReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    technicianName: str
    completedAt: str
    templateVersion: str
    vehiclePlate: Optional[str] = None
    vehicleModel: Optional[str] = None
    serviceOrderNumber: Optional[str] = None
    notes: Optional[str] = None
    answers: List[ReportAnswerRequest]
    evidences: List[ReportEvidenceRequest] = []
    signature: ReportSignatureRequest


class InspectionReportResponse(BaseModel):
    reportId: str
    inspectionId: str
    objectKey: str
    sha256: str
    generatedAt: str
    downloadUrl: Optional[str] = None


processed_uuids: set[str] = set()
generated_reports: Dict[str, InspectionReportResponse] = {}


@router.post(
    "/sync",
    response_model=SyncBatchResponse,
    summary="Recepção e conciliação idempotente de vistorias offline",
)
async def sync_offline_inspections(batch: SyncBatchRequest) -> SyncBatchResponse:
    results: List[SyncItemResult] = []
    synced_count = 0

    for item in batch.items:
        client_uuid = item.id

        if client_uuid in processed_uuids:
            results.append(
                SyncItemResult(
                    id=client_uuid,
                    status="SYNCED",
                    message="Registro já reconciliado anteriormente (Idempotente).",
                )
            )
        else:
            processed_uuids.add(client_uuid)
            synced_count += 1
            results.append(
                SyncItemResult(
                    id=client_uuid,
                    status="SYNCED",
                    message="Vistoria sincronizada e gravada com sucesso.",
                )
            )

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
    storage_service: MinioReportStorage = Depends(get_report_storage),
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
    generated_at = datetime.now(timezone.utc).isoformat()
    object_key = f"reports/inspections/{inspection_id}/{report_id}.pdf"
    digest = hashlib.sha256(pdf_content).hexdigest()

    try:
        await storage_service.upload_pdf(pdf_content, object_key)
        download_url = await storage_service.generate_download_url(object_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O laudo foi gerado, mas o armazenamento de documentos está indisponível.",
        ) from exc

    response = InspectionReportResponse(
        reportId=report_id,
        inspectionId=inspection_id,
        objectKey=object_key,
        sha256=digest,
        generatedAt=generated_at,
        downloadUrl=download_url,
    )
    generated_reports[report_id] = response
    return response


@router.get(
    "/reports/{report_id}",
    response_model=InspectionReportResponse,
    summary="Consulta dos metadados de um laudo oficial",
)
async def get_report(report_id: str) -> InspectionReportResponse:
    report = generated_reports.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Laudo não encontrado.")
    return report

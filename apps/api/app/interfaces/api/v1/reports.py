import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.application.services.operational_reports import (
    SAMPLE_OPERATIONAL_RECORDS,
    build_operational_summary,
    filter_records,
    generate_operational_pdf,
    generate_operational_xlsx,
)

router = APIRouter(prefix="/reports", tags=["Relatórios Operacionais"])


def _selected_records(start_date: Optional[date], end_date: Optional[date]):
    return filter_records(SAMPLE_OPERATIONAL_RECORDS, start_date, end_date)


@router.get("/operational", summary="Indicadores operacionais por equipe e frota")
async def operational_summary(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> dict:
    return build_operational_summary(_selected_records(start_date, end_date))


@router.get("/operational.xlsx", summary="Exporta o relatório operacional em Excel")
async def export_operational_xlsx(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> StreamingResponse:
    content = generate_operational_xlsx(_selected_records(start_date, end_date))
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="nexusops-relatorio-operacional.xlsx"'
        },
    )


@router.get("/operational.pdf", summary="Exporta o relatório operacional em PDF")
async def export_operational_pdf(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> StreamingResponse:
    content = generate_operational_pdf(_selected_records(start_date, end_date))
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="nexusops-relatorio-operacional.pdf"'
        },
    )

import io
from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.services.operational_reports import (
    OperationalRecord,
    build_operational_summary,
    generate_operational_pdf,
    generate_operational_xlsx,
)
from app.infrastructure.database.models.incident_model import IncidentModel
from app.infrastructure.database.models.inspection_model import InspectionModel
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/reports", tags=["Relatórios Operacionais"])


async def _selected_records(
    session: AsyncSession,
    start_date: date | None,
    end_date: date | None,
) -> list[OperationalRecord]:
    statement = (
        select(InspectionModel)
        .options(selectinload(InspectionModel.answers))
        .order_by(InspectionModel.created_at)
    )
    result = await session.execute(statement)
    inspections = [
        inspection
        for inspection in result.scalars().unique().all()
        if (start_date is None or inspection.created_at.date() >= start_date)
        and (end_date is None or inspection.created_at.date() <= end_date)
    ]
    users_result = await session.execute(
        select(UserModel).where(UserModel.role == "TECNICO")
    )
    teams_by_name = {
        user.full_name: user.team_name or "Sem equipe"
        for user in users_result.scalars().all()
    }
    incidents_result = await session.execute(select(IncidentModel))
    incidents_by_inspection: dict[str, list[IncidentModel]] = defaultdict(list)
    for incident in incidents_result.scalars().all():
        if incident.inspection_id:
            incidents_by_inspection[incident.inspection_id].append(incident)

    records = []
    for inspection in inspections:
        incidents = [
            *incidents_by_inspection.get(inspection.id, []),
            *incidents_by_inspection.get(inspection.client_generated_id, []),
        ]
        conforming = sum(
            answer.answer_value.upper() in {"SIM", "YES", "CONFORME", "OK", "TRUE"}
            for answer in inspection.answers
        )
        records.append(
            OperationalRecord(
                occurred_on=inspection.created_at.date(),
                team=teams_by_name.get(inspection.technician_name, "Sem equipe"),
                vehicle=inspection.vehicle_model
                or inspection.vehicle_plate
                or "Sem veículo",
                vehicle_plate=inspection.vehicle_plate or "—",
                inspections=1,
                checklist_items=len(inspection.answers),
                conforming_items=conforming,
                nonconformities=len(incidents),
                critical_nonconformities=sum(
                    incident.severity in {"CRITICA", "CRÍTICA"}
                    for incident in incidents
                ),
                resolved_nonconformities=sum(
                    incident.status == "RESOLVIDA" for incident in incidents
                ),
            )
        )
    return records


@router.get("/operational")
async def operational_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
) -> dict:
    return build_operational_summary(
        await _selected_records(session, start_date, end_date)
    )


@router.get("/operational.xlsx")
async def export_operational_xlsx(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    content = generate_operational_xlsx(
        await _selected_records(session, start_date, end_date)
    )
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="nexusops-relatorio-operacional.xlsx"'
        },
    )


@router.get("/operational.pdf")
async def export_operational_pdf(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    content = generate_operational_pdf(
        await _selected_records(session, start_date, end_date)
    )
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="nexusops-relatorio-operacional.pdf"'
        },
    )

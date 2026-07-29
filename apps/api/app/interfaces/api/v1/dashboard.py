from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.apr_model import AprAssessmentModel
from app.infrastructure.database.models.incident_model import ActionPlanModel, IncidentModel
from app.infrastructure.database.models.inspection_model import (
    InspectionAnswerModel,
    InspectionModel,
)
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.models.vehicle_model import VehicleModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/strategic")
async def get_strategic_dashboard(
    session: AsyncSession = Depends(get_db),
) -> dict:
    now = datetime.now(UTC)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    period_start = today - timedelta(days=29)

    inspections_today = await session.scalar(
        select(func.count())
        .select_from(InspectionModel)
        .where(InspectionModel.created_at >= today)
    ) or 0
    inspections_period = await session.scalar(
        select(func.count())
        .select_from(InspectionModel)
        .where(InspectionModel.created_at >= period_start)
    ) or 0
    answers = await session.execute(
        select(
            func.count(InspectionAnswerModel.id),
            func.sum(
                case(
                    (
                        func.upper(InspectionAnswerModel.answer_value).in_(
                            ["SIM", "YES", "CONFORME", "OK", "TRUE"]
                        ),
                        1,
                    ),
                    else_=0,
                )
            ),
        )
    )
    answer_total, conforming_total = answers.one()
    compliance_rate = (
        round((conforming_total or 0) / answer_total * 100, 1) if answer_total else 0
    )

    open_statuses = ["ABERTA", "EM_ANALISE", "PLANO_DE_ACAO"]
    open_incidents = await session.scalar(
        select(func.count())
        .select_from(IncidentModel)
        .where(IncidentModel.status.in_(open_statuses))
    ) or 0
    resolved_incidents = await session.scalar(
        select(func.count())
        .select_from(IncidentModel)
        .where(IncidentModel.status == "RESOLVIDA")
    ) or 0
    critical_incidents = await session.scalar(
        select(func.count())
        .select_from(IncidentModel)
        .where(
            IncidentModel.status.in_(open_statuses),
            IncidentModel.severity.in_(["CRITICA", "CRÍTICA"]),
        )
    ) or 0
    pending_aprs = await session.scalar(
        select(func.count())
        .select_from(AprAssessmentModel)
        .where(AprAssessmentModel.status == "PENDING_AUTHORIZATION")
    ) or 0
    active_vehicles = await session.scalar(
        select(func.count())
        .select_from(VehicleModel)
        .where(VehicleModel.status.in_(["DISPONIVEL", "EM_VISTORIA"]))
    ) or 0
    unavailable_vehicles = await session.scalar(
        select(func.count())
        .select_from(VehicleModel)
        .where(VehicleModel.status.in_(["MANUTENCAO", "INDISPONIVEL"]))
    ) or 0
    active_technicians = await session.scalar(
        select(func.count())
        .select_from(UserModel)
        .where(UserModel.role == "TECNICO", UserModel.is_active.is_(True))
    ) or 0
    overdue_actions = await session.scalar(
        select(func.count())
        .select_from(ActionPlanModel)
        .where(
            ActionPlanModel.resolved_at.is_(None),
            ActionPlanModel.due_date < now.isoformat(),
        )
    ) or 0

    total_incidents = open_incidents + resolved_incidents
    resolution_rate = (
        round(resolved_incidents / total_incidents * 100, 1)
        if total_incidents
        else 0
    )

    recent_result = await session.execute(
        select(IncidentModel)
        .where(IncidentModel.status.in_(open_statuses))
        .order_by(
            case(
                (IncidentModel.severity.in_(["CRITICA", "CRÍTICA"]), 0),
                (IncidentModel.severity == "ALTA", 1),
                else_=2,
            ),
            IncidentModel.created_at.desc(),
        )
        .limit(5)
    )
    attention = [
        {
            "id": incident.code,
            "title": incident.question_text,
            "severity": incident.severity,
            "status": incident.status,
            "owner": incident.technician_name,
            "team": incident.team_name,
            "reportedAt": incident.created_at.isoformat(),
        }
        for incident in recent_result.scalars().all()
    ]

    activity = []
    for offset in range(6, -1, -1):
        day_start = today - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        count = await session.scalar(
            select(func.count())
            .select_from(InspectionModel)
            .where(
                InspectionModel.created_at >= day_start,
                InspectionModel.created_at < day_end,
            )
        ) or 0
        activity.append({"date": day_start.date().isoformat(), "inspections": count})

    return {
        "generatedAt": now.isoformat(),
        "overview": {
            "inspectionsToday": inspections_today,
            "inspectionsPeriod": inspections_period,
            "complianceRate": compliance_rate,
            "pendingAprs": pending_aprs,
            "openIncidents": open_incidents,
            "criticalIncidents": critical_incidents,
            "overdueActions": overdue_actions,
            "resolutionRate": resolution_rate,
            "activeVehicles": active_vehicles,
            "unavailableVehicles": unavailable_vehicles,
            "activeTechnicians": active_technicians,
        },
        "attention": attention,
        "activity": activity,
    }


@router.get("/kpis")
async def get_dashboard_kpis(
    session: AsyncSession = Depends(get_db),
) -> dict:
    strategic = await get_strategic_dashboard(session)
    overview = strategic["overview"]
    return {
        "inspections_today": overview["inspectionsToday"],
        "pending_aprs": overview["pendingAprs"],
        "active_vehicles": overview["activeVehicles"],
        "incidents_pending": overview["openIncidents"],
    }

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select, func
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.database.models.inspection_model import InspectionModel
from app.infrastructure.database.models.apr_model import AprAssessmentModel
from app.infrastructure.database.models.vehicle_model import VehicleModel
from app.infrastructure.database.models.incident_model import IncidentModel
from datetime import datetime, timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

class DashboardKpisResponse(BaseModel):
    inspections_today: int
    pending_aprs: int
    active_vehicles: int
    incidents_pending: int

@router.get("/kpis", response_model=DashboardKpisResponse)
async def get_dashboard_kpis():
    async with AsyncSessionLocal() as session:
        # 1. Total Inspections
        # TODO: Filter by created_at >= start_of_day for exact "today"
        result_insp = await session.execute(select(func.count()).select_from(InspectionModel))
        total_inspections = result_insp.scalar() or 0
        
        # 2. Pending APRs (DRAFT or PENDING)
        result_apr = await session.execute(
            select(func.count()).select_from(AprAssessmentModel)
            .where(AprAssessmentModel.status.in_(["DRAFT", "PENDING", "RASCUNHO", "PENDENTE"]))
        )
        pending_aprs = result_apr.scalar() or 0
        
        # 3. Active Vehicles
        result_veh = await session.execute(
            select(func.count()).select_from(VehicleModel)
            .where(VehicleModel.status.in_(["AVAILABLE", "DISPONIVEL", "ATIVO"]))
        )
        active_vehicles = result_veh.scalar() or 0
        
        # 4. Pending Incidents
        result_inc = await session.execute(
            select(func.count()).select_from(IncidentModel)
            .where(IncidentModel.status.in_(["OPEN", "IN_PROGRESS", "ABERTA", "EM_ANDAMENTO"]))
        )
        pending_incidents = result_inc.scalar() or 0
        
        return DashboardKpisResponse(
            inspections_today=total_inspections,
            pending_aprs=pending_aprs,
            active_vehicles=active_vehicles,
            incidents_pending=pending_incidents
        )

from fastapi import APIRouter, Depends

from app.core.auth import enforce_rbac
from app.interfaces.api.v1.apr import router as apr_router
from app.interfaces.api.v1.auth import router as auth_router
from app.interfaces.api.v1.checklists import router as checklists_router
from app.interfaces.api.v1.dashboard import router as dashboard_router
from app.interfaces.api.v1.health import router as health_router
from app.interfaces.api.v1.incidents import router as incidents_router
from app.interfaces.api.v1.inspections import router as inspections_router
from app.interfaces.api.v1.reports import router as reports_router
from app.interfaces.api.v1.settings import router as settings_router
from app.interfaces.api.v1.technicians import router as technicians_router
from app.interfaces.api.v1.users import router as users_router
from app.interfaces.api.v1.vehicles import router as vehicles_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
protected = [Depends(enforce_rbac)]
api_router.include_router(inspections_router, dependencies=protected)
api_router.include_router(vehicles_router, dependencies=protected)
api_router.include_router(checklists_router, dependencies=protected)
api_router.include_router(incidents_router, dependencies=protected)
api_router.include_router(apr_router, dependencies=protected)
api_router.include_router(reports_router, dependencies=protected)
api_router.include_router(dashboard_router, dependencies=protected)
api_router.include_router(technicians_router, dependencies=protected)
api_router.include_router(users_router, dependencies=protected)
api_router.include_router(settings_router, dependencies=protected)

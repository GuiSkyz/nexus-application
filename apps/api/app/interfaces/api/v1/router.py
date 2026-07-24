from fastapi import APIRouter
from app.interfaces.api.v1.health import router as health_router
from app.interfaces.api.v1.auth import router as auth_router
from app.interfaces.api.v1.inspections import router as inspections_router
from app.interfaces.api.v1.vehicles import router as vehicles_router
from app.interfaces.api.v1.checklists import router as checklists_router
from app.interfaces.api.v1.incidents import router as incidents_router
from app.interfaces.api.v1.apr import router as apr_router
from app.interfaces.api.v1.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(inspections_router)
api_router.include_router(vehicles_router)
api_router.include_router(checklists_router)
api_router.include_router(incidents_router)
api_router.include_router(apr_router)
api_router.include_router(reports_router)

import logging
from fastapi import APIRouter, status, Response
from pydantic import BaseModel
from typing import Dict
from sqlalchemy import text
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.redis.client import check_redis_health
from app.infrastructure.minio.client import check_minio_health

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    version: str = "0.1.0"


class ReadinessResponse(BaseModel):
    status: str
    services: Dict[str, str]


@router.get(
    "/health",
    summary="Liveness probe simples do serviço FastAPI",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK
)
async def check_liveness() -> HealthResponse:
    """Retorna resposta simples indicando que a API está ativa no servidor."""
    return HealthResponse(status="active", version="0.1.0")


@router.get(
    "/health/ready",
    summary="Readiness probe completa verificando Postgres, Redis e MinIO",
    response_model=ReadinessResponse
)
async def check_readiness(response: Response) -> ReadinessResponse:
    """
    Verifica a saúde e conectividade real com as 3 camadas oficiais da infraestrutura:
    PostgreSQL, Redis e MinIO.
    """
    services_status: Dict[str, str] = {
        "postgres": "unhealthy",
        "redis": "unhealthy",
        "minio": "unhealthy"
    }

    # 1. Verificar PostgreSQL
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            services_status["postgres"] = "healthy"
    except Exception as e:
        logger.error(f"Falha na checagem do PostgreSQL no /health/ready: {e}")
        services_status["postgres"] = "unhealthy"

    # 2. Verificar Redis
    try:
        redis_ok = await check_redis_health()
        if redis_ok:
            services_status["redis"] = "healthy"
    except Exception as e:
        logger.error(f"Falha na checagem do Redis no /health/ready: {e}")
        services_status["redis"] = "unhealthy"

    # 3. Verificar MinIO
    try:
        minio_ok = await check_minio_health()
        if minio_ok:
            services_status["minio"] = "healthy"
    except Exception as e:
        logger.error(f"Falha na checagem do MinIO no /health/ready: {e}")
        services_status["minio"] = "unhealthy"

    # Determinar status global
    all_healthy = all(s == "healthy" for s in services_status.values())
    overall_status = "ready" if all_healthy else "unready"

    if not all_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponse(
        status=overall_status,
        services=services_status
    )

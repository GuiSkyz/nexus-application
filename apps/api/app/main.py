from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging, RequestIdMiddleware
from app.core.exceptions import (
    NexusOpsException,
    nexusops_exception_handler,
    global_exception_handler
)
from app.interfaces.api.v1.router import api_router
from app.interfaces.api.v1.health import router as health_router
from app.infrastructure.redis.client import close_redis

settings = get_settings()
setup_logging(app_name=settings.APP_NAME, environment=settings.ENVIRONMENT)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gerencia o ciclo de vida do servidor FastAPI.
    Valida configurações na inicialização e encerra pools de conexão na parada.
    """
    logger.info(f"Iniciando {settings.APP_NAME} na versão {settings.APP_VERSION} (Ambiente: {settings.ENVIRONMENT})")
    # A validação das configurações já ocorreu via Pydantic Settings
    yield
    logger.info("Encerrando serviços e pools de conexões assíncronas do NexusOps...")
    await close_redis()
    logger.info("NexusOps finalizado com sucesso.")


def create_app() -> FastAPI:
    """Fábrica oficial da aplicação FastAPI do NexusOps."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Operational Compliance Platform voltada para provedores de internet (ISPs). API Oficial.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # Configuração de CORS por Ambiente (Segurança)
    allowed_origins = (
        ["*"]
        if settings.ENVIRONMENT == "development"
        else settings.get_cors_origins()
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middleware para Request ID (Rastreabilidade nos logs estruturados)
    app.add_middleware(RequestIdMiddleware)

    # Exception Handlers
    app.add_exception_handler(NexusOpsException, nexusops_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # Rotas versionadas V1
    app.include_router(api_router, prefix=settings.API_V1_STR)
    # Rotas na raiz para compatibilidade imediata com health checks e orquestradores
    app.include_router(health_router)

    return app


app = create_app()

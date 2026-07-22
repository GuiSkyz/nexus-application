import json
import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import Request, Response
from starlette.middleware.base import BaseMiddleware, RequestResponseEndpoint

# ContextVar para propagar request_id nas rotas e logs assíncronos/síncronos
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="system")

# Chaves sensíveis que nunca devem ser expostas nos logs
SENSITIVE_KEYS = {"password", "token", "authorization", "secret", "cpf", "rg", "document_number", "credit_card"}


class StructuredJSONFormatter(logging.Formatter):
    """
    Formatador de logs estruturados em formato JSON puro.
    Inclui timestamp (ISO 8601 UTC), level, service, environment, request_id e message.
    """
    def __init__(self, app_name: str, environment: str):
        super().__init__()
        self.app_name = app_name
        self.environment = environment

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.app_name,
            "environment": self.environment,
            "request_id": request_id_ctx_var.get(),
            "message": record.getMessage()
        }

        # Mascarar ou checar campos adicionais extras se existirem
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_obj.update(self._mask_sensitive(record.extra_data))

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj, ensure_ascii=False)

    def _mask_sensitive(self, data: Dict[str, Any]) -> Dict[str, Any]:
        masked = {}
        for key, value in data.items():
            if key.lower() in SENSITIVE_KEYS:
                masked[key] = "***MASKED***"
            elif isinstance(value, dict):
                masked[key] = self._mask_sensitive(value)
            else:
                masked[key] = value
        return masked


def setup_logging(app_name: str, environment: str) -> None:
    """Configura o logger raiz do Python com o formatador JSON."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJSONFormatter(app_name=app_name, environment=environment))

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO if environment != "development" else logging.DEBUG)
    root_logger.handlers = [handler]

    # Reduzir ruído dos loggers externos
    logging.getLogger("uvicorn.access").disabled = True
    logging.getLogger("alembic").setLevel(logging.INFO)


class RequestIdMiddleware(BaseMiddleware):
    """
    Middleware que gera um UUIDv4 de request_id para cada requisição HTTP,
    injetando no contexto de logs e no cabeçalho de resposta X-Request-ID.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        token = request_id_ctx_var.set(req_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            request_id_ctx_var.reset(token)

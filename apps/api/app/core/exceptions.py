from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class NexusOpsException(Exception):
    """Exceção base da plataforma NexusOps."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class ResourceNotFoundException(NexusOpsException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"Recurso '{resource}' com identificador '{identifier}' não encontrado.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)}
        )


class UnauthorizedException(NexusOpsException):
    def __init__(self, message: str = "Acesso não autorizado ao recurso."):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(NexusOpsException):
    def __init__(self, message: str = "Permissão insuficiente para realizar esta operação."):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class InfrastructureUnavailableException(NexusOpsException):
    def __init__(self, service_name: str):
        super().__init__(
            message=f"O serviço de infraestrutura '{service_name}' está temporariamente indisponível.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service_name}
        )


async def nexusops_exception_handler(request: Request, exc: NexusOpsException) -> JSONResponse:
    """Manipulador global para exceções de domínio da aplicação."""
    logger.warning(
        f"Exceção de Domínio tratada: {exc.message}",
        extra={"extra_data": {"path": request.url.path, "status_code": exc.status_code, "details": exc.details}}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "status_code": exc.status_code,
                "details": exc.details
            }
        }
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Manipulador global de segurança para evitar exposição de stack traces em produção."""
    logger.error(
        f"Erro interno não tratado no servidor: {str(exc)}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "message": "Ocorreu um erro interno inesperado no servidor. Tente novamente mais tarde ou contate o suporte.",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
            }
        }
    )

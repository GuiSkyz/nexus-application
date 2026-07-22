import logging
from typing import Optional
from minio import Minio
from minio.error import S3Error
import urllib.request
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_minio_client: Optional[Minio] = None


def get_minio_client() -> Minio:
    """Retorna a instância singleton do cliente oficial MinIO S3."""
    global _minio_client
    if _minio_client is None:
        settings = get_settings()
        # Endpoint Minio não deve incluir http:// ou https:// quando configurado no SDK, mas tratamos aqui
        endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
        _minio_client = Minio(
            endpoint=endpoint,
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=settings.MINIO_USE_SSL
        )
    return _minio_client


async def check_minio_health() -> bool:
    """
    Executa verificação de saúde no MinIO verificando se o bucket padrão existe
    ou se o endpoint responde adequadamente.
    """
    settings = get_settings()
    try:
        client = get_minio_client()
        # Verificar se o bucket existe no storage
        exists = client.bucket_exists(settings.MINIO_DEFAULT_BUCKET)
        return True
    except Exception as e:
        logger.warning(f"Falha ao verificar bucket MinIO via SDK: {e}. Tentando check HTTP...")
        try:
            url = f"http://{settings.MINIO_ENDPOINT}/minio/health/live"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception as http_err:
            logger.error(f"Falha na verificação de saúde HTTP do MinIO: {http_err}")
            return False

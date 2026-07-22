import logging
from typing import Optional
import redis.asyncio as aioredis
from redis.exceptions import RedisError
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Cache de conexão global singleton
_redis_pool: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Retorna ou inicializa o cliente/pool assíncrono do Redis."""
    global _redis_pool
    if _redis_pool is None:
        settings = get_settings()
        _redis_pool = aioredis.from_url(
            settings.get_redis_url(),
            encoding="utf-8",
            decode_responses=True,
            max_connections=20
        )
    return _redis_pool


async def check_redis_health() -> bool:
    """Executa verificação de saúde PING no Redis."""
    try:
        client = await get_redis_client()
        pong = await client.ping()
        return pong is True
    except (RedisError, Exception) as e:
        logger.error(f"Falha na verificação de saúde do Redis: {e}")
        return False


async def close_redis() -> None:
    """Encerra graciosamente a conexão com o pool do Redis."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None

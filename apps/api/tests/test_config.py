import pytest
from app.core.config import Settings, get_settings


def test_settings_default_values() -> None:
    """Verifica se o carregamento de configurações retorna os valores e tipos esperados."""
    settings = get_settings()
    assert settings.APP_NAME == "NexusOps"
    assert settings.API_V1_STR == "/api/v1"
    assert isinstance(settings.API_PORT, int)


def test_database_url_generation() -> None:
    """Verifica a montagem correta das URLs assíncrona e síncrona do PostgreSQL."""
    settings = Settings(
        POSTGRES_USER="test_user",
        POSTGRES_PASSWORD="test_password",
        POSTGRES_SERVER="localhost",
        POSTGRES_PORT=5432,
        POSTGRES_DB="test_db",
        DATABASE_URL=None,
        DATABASE_SYNC_URL=None
    )
    async_url = settings.get_database_async_url()
    sync_url = settings.get_database_sync_url()

    assert async_url == "postgresql+asyncpg://test_user:test_password@localhost:5432/test_db"
    assert sync_url == "postgresql://test_user:test_password@localhost:5432/test_db"


def test_redis_url_generation() -> None:
    """Verifica a geração de URL de conexão ao Redis."""
    settings = Settings(
        REDIS_HOST="localhost",
        REDIS_PORT=6379,
        REDIS_PASSWORD="secret_pass",
        REDIS_DB=1,
        REDIS_URL=None
    )
    redis_url = settings.get_redis_url()
    assert redis_url == "redis://:secret_pass@localhost:6379/1"

import pytest
from pydantic import ValidationError

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


def test_connection_urls_escape_credentials() -> None:
    settings = Settings(
        POSTGRES_USER="user@example.com",
        POSTGRES_PASSWORD="p@ss:/word",
        POSTGRES_SERVER="postgres",
        POSTGRES_DB="nexus ops",
        DATABASE_URL=None,
        DATABASE_SYNC_URL=None,
        REDIS_PASSWORD="redis@pass/word",
        REDIS_URL=None,
    )

    assert settings.get_database_async_url() == (
        "postgresql+asyncpg://user%40example.com:p%40ss%3A%2Fword@"
        "postgres:5432/nexus%20ops"
    )
    assert settings.get_redis_url() == "redis://:redis%40pass%2Fword@redis:6379/0"


def test_production_rejects_insecure_settings() -> None:
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="replace-with-at-least-64-random-characters",
            CORS_ORIGINS="*",
        )

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_liveness_endpoint(client: AsyncClient) -> None:
    """Verifica se o liveness probe /health responde status active com sucesso e estrutura correta."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_liveness_endpoint_v1(client: AsyncClient) -> None:
    """Verifica acessibilidade da rota /health também através do prefixo versionado /api/v1."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"


@pytest.mark.asyncio
@patch("app.interfaces.api.v1.health.check_minio_health", new_callable=AsyncMock)
@patch("app.interfaces.api.v1.health.check_redis_health", new_callable=AsyncMock)
@patch("app.interfaces.api.v1.health.AsyncSessionLocal")
async def test_readiness_endpoint_all_healthy(mock_session_cls: MagicMock, mock_redis: AsyncMock, mock_minio: AsyncMock, client: AsyncClient) -> None:
    """Verifica se /health/ready retorna 'ready' quando Postgres, Redis e MinIO estão saudáveis."""
    # Mock do Postgres SELECT 1
    mock_session = AsyncMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_session
    mock_session.execute.return_value = None

    # Mock de Redis e MinIO
    mock_redis.return_value = True
    mock_minio.return_value = True

    response = await client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["services"]["postgres"] == "healthy"
    assert data["services"]["redis"] == "healthy"
    assert data["services"]["minio"] == "healthy"


@pytest.mark.asyncio
@patch("app.interfaces.api.v1.health.check_minio_health", new_callable=AsyncMock)
@patch("app.interfaces.api.v1.health.check_redis_health", new_callable=AsyncMock)
@patch("app.interfaces.api.v1.health.AsyncSessionLocal")
async def test_readiness_endpoint_unhealthy_service(mock_session_cls: MagicMock, mock_redis: AsyncMock, mock_minio: AsyncMock, client: AsyncClient) -> None:
    """Verifica se /health/ready retorna 503 e 'unready' caso um dos serviços falhe."""
    mock_session = AsyncMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_session
    mock_session.execute.return_value = None

    mock_redis.return_value = True
    mock_minio.return_value = False  # Simula falha no MinIO

    response = await client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unready"
    assert data["services"]["minio"] == "unhealthy"

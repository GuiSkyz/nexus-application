from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.incident_model import (
    ActionPlanModel,
    IncidentModel,
)
from app.infrastructure.database.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
async def isolated_incident_database() -> AsyncGenerator[None, None]:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: Base.metadata.create_all(
                sync_connection,
                tables=[IncidentModel.__table__, ActionPlanModel.__table__],
            )
        )

    async with session_factory() as session:
        session.add_all(
            [
                IncidentModel(
                    code="NC-2026-085",
                    inspection_title="Inspeção de escada",
                    context_type="VEHICLE",
                    vehicle_plate="ABC1D23",
                    vehicle_model="Caminhonete 12",
                    technician_name="João Silva",
                    team_name="Equipe Alfa",
                    question_text="A escada está livre de trincas?",
                    category="SEGURANÇA",
                    severity="ALTA",
                    status="ABERTA",
                    description="Degrau com trinca estrutural.",
                ),
                IncidentModel(
                    code="NC-2026-086",
                    inspection_title="Checklist de saída",
                    context_type="VEHICLE",
                    vehicle_plate="DEF4G56",
                    vehicle_model="Caminhonete 08",
                    technician_name="Maria Souza",
                    team_name="Equipe Beta",
                    question_text="Os pneus estão calibrados?",
                    category="VEÍCULO",
                    severity="MÉDIA",
                    status="ABERTA",
                    description="Pneu dianteiro abaixo da pressão recomendada.",
                ),
            ]
        )
        await session.commit()

    async def override_get_db() -> AsyncGenerator:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)
        await engine.dispose()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Cliente assíncrono para testes funcionais da API."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

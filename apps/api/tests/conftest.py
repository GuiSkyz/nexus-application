from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import get_password_hash
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.incident_model import IncidentModel
from app.infrastructure.database.models.inspection_model import (
    InspectionAnswerModel,
    InspectionModel,
)
from app.infrastructure.database.models.user_model import UserModel
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
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        technicians = [
            UserModel(
                email=f"tecnico{index}@example.com",
                hashed_password="not-used-in-tests",
                full_name=name,
                role="TECNICO",
                employee_code=f"TEC-{index:03d}",
                team_name=team,
                is_active=True,
            )
            for index, (name, team) in enumerate(
                [
                    ("João Silva", "Equipe Alfa"),
                    ("Maria Souza", "Equipe Beta"),
                    ("Carlos Lima", "Equipe Gama"),
                ],
                start=1,
            )
        ]
        coordinator = UserModel(
            email="coordenador@nexusops.com",
            hashed_password=get_password_hash("senha123"),
            full_name="Coordenação Operacional",
            role="COORDENADOR",
            employee_code="COORD-001",
            is_active=True,
        )
        master = UserModel(
            email="master@nexusops.com",
            hashed_password=get_password_hash("MasterTeste123!"),
            full_name="Master NexusOps",
            role="MASTER",
            employee_code="MASTER-001",
            is_active=True,
        )
        inspections = [
            InspectionModel(
                client_generated_id=f"00000000-0000-0000-0000-00000000000{index}",
                template_id="template-test",
                template_version="1",
                title="Checklist operacional",
                vehicle_plate=plate,
                vehicle_model=vehicle,
                technician_name=technicians[index - 1].full_name,
                status="COMPLETED",
            )
            for index, (plate, vehicle) in enumerate(
                [
                    ("ABC1D23", "Caminhonete 12"),
                    ("DEF4G56", "Caminhonete 08"),
                    ("GHI7J89", "Van 04"),
                ],
                start=1,
            )
        ]
        session.add_all([coordinator, master, *technicians, *inspections])
        await session.flush()
        answers = [
            InspectionAnswerModel(
                inspection_id=inspection.id,
                question_id=f"question-{index}",
                answer_value="SIM",
            )
            for index, inspection in enumerate(inspections, start=1)
        ]
        session.add_all(
            [
                *answers,
                IncidentModel(
                    code="NC-2026-085",
                    inspection_id=inspections[0].id,
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
                    inspection_id=inspections[1].id,
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
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "master@nexusops.com",
                "password": "MasterTeste123!",
            },
        )
        assert response.status_code == 200
        yield ac

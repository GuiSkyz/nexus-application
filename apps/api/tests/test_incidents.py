import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_incidents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/incidents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2


@pytest.mark.asyncio
async def test_create_action_plan_and_resolve():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Cadastrar Plano de Ação
        plan_req = {
            "description": "Troca de resina e fibra do degrau rachado",
            "assignedTo": "Oficina de Escadas Credenciada",
            "dueDate": "2026-07-25T18:00:00Z",
            "createdBy": "Supervisor Operacional",
        }
        res1 = await ac.post("/api/v1/incidents/NC-2026-085/action-plan", json=plan_req)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["status"] == "PLANO_DE_ACAO"
        assert data1["actionPlan"]["assignedTo"] == "Oficina de Escadas Credenciada"

        # 2. Dar Baixa / Resolver NC
        resolve_req = {"resolutionNotes": "Escada reparada e laudo de carga aprovado."}
        res2 = await ac.post("/api/v1/incidents/NC-2026-085/resolve", json=resolve_req)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "RESOLVIDA"

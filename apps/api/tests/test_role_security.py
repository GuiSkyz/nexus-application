import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_technician_can_only_read_vehicles_on_management_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as technician:
        login = await technician.post(
            "/api/v1/auth/login",
            json={
                "email": "tecnico1@example.com",
                "password": "TecnicoTeste123!",
            },
        )
        assert login.status_code == 200

        assert (await technician.get("/api/v1/vehicles")).status_code == 200

        forbidden_reads = [
            "/api/v1/dashboard/strategic",
            "/api/v1/technicians",
            "/api/v1/checklists",
            "/api/v1/apr",
            "/api/v1/reports/operational",
            "/api/v1/settings",
            "/api/v1/users",
        ]
        for path in forbidden_reads:
            response = await technician.get(path)
            assert response.status_code == 403, path

        incidents = await technician.get("/api/v1/incidents")
        assert incidents.status_code == 200
        assert [item["technicianName"] for item in incidents.json()] == ["João Silva"]

        create_vehicle = await technician.post(
            "/api/v1/vehicles",
            json={
                "plate": "RBAC123",
                "model": "Veículo bloqueado",
                "year": 2026,
                "category": "INSTALACAO",
                "status": "DISPONIVEL",
            },
        )
        assert create_vehicle.status_code == 403


@pytest.mark.asyncio
async def test_technician_can_still_sync_field_work():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as technician:
        await technician.post(
            "/api/v1/auth/login",
            json={
                "email": "tecnico1@example.com",
                "password": "TecnicoTeste123!",
            },
        )
        response = await technician.post(
            "/api/v1/inspections/sync",
            json={
                "items": [
                    {
                        "id": "04da56f2-a115-4afb-bdde-7d95340c30ae",
                        "entityType": "INSPECTION",
                        "payload": {
                            "title": "Inspeção enviada pelo aplicativo",
                            "vehiclePlate": "ABC1D23",
                            "templateId": "template-test",
                            "templateVersion": 1,
                            "questions": [
                                {
                                    "id": "question-mobile",
                                    "category": "Segurança",
                                    "questionText": "O equipamento está conforme?",
                                }
                            ],
                            "answers": {"question-mobile": "CONFORME"},
                        },
                        "createdAt": "2026-07-29T20:00:00Z",
                        "status": "PENDING",
                    }
                ]
            },
        )
        assert response.status_code == 200
        assert response.json()["syncedCount"] == 1

        context = await technician.get("/api/v1/inspections/mobile-context")
        assert context.status_code == 200
        body = context.json()
        assert body["user"]["email"] == "tecnico1@example.com"
        assert any(
            item["clientGeneratedId"]
            == "04da56f2-a115-4afb-bdde-7d95340c30ae"
            for item in body["history"]
        )


@pytest.mark.asyncio
async def test_technician_can_view_own_action_plan_only():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as manager:
        login = await manager.post(
            "/api/v1/auth/login",
            json={"email": "master@nexusops.com", "password": "MasterTeste123!"},
        )
        assert login.status_code == 200
        plan = await manager.post(
            "/api/v1/incidents/NC-2026-085/action-plan",
            json={
                "description": "Substituir a escada antes da próxima atividade.",
                "dueDate": "2026-08-01T18:00:00Z",
                "createdBy": "Coordenação Operacional",
            },
        )
        assert plan.status_code == 200

    async with AsyncClient(transport=transport, base_url="http://test") as technician:
        login = await technician.post(
            "/api/v1/auth/login",
            json={"email": "tecnico1@example.com", "password": "TecnicoTeste123!"},
        )
        assert login.status_code == 200
        response = await technician.get("/api/v1/incidents")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "NC-2026-085"
    assert response.json()[0]["actionPlan"]["description"] == (
        "Substituir a escada antes da próxima atividade."
    )


@pytest.mark.asyncio
async def test_technician_cannot_sync_another_vehicle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as technician:
        await technician.post(
            "/api/v1/auth/login",
            json={
                "email": "tecnico1@example.com",
                "password": "TecnicoTeste123!",
            },
        )
        response = await technician.post(
            "/api/v1/inspections/sync",
            json={
                "items": [
                    {
                        "id": "58e07399-c5bb-43ed-9e50-7976964711b5",
                        "entityType": "INSPECTION",
                        "payload": {
                            "title": "Veículo não atribuído",
                            "vehicleId": "00000000-0000-0000-0000-000000000999",
                        },
                        "createdAt": "2026-07-29T20:00:00Z",
                    }
                ]
            },
        )
        assert response.status_code == 403

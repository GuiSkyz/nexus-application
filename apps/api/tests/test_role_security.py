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
            "/api/v1/incidents",
            "/api/v1/apr",
            "/api/v1/reports/operational",
            "/api/v1/settings",
            "/api/v1/users",
        ]
        for path in forbidden_reads:
            response = await technician.get(path)
            assert response.status_code == 403, path

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
                        },
                        "createdAt": "2026-07-29T20:00:00Z",
                        "status": "PENDING",
                    }
                ]
            },
        )
        assert response.status_code == 200

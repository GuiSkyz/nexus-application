from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import decode_access_token
from app.main import app


@pytest.mark.asyncio
async def test_auth_login_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"email": "coordenador@nexusops.com", "password": "senha123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "COORDENADOR"
        assert "nexusops_session" in response.cookies

        me_response = await ac.get("/api/v1/auth/me")
        assert me_response.status_code == 200
        assert me_response.json()["email"] == "coordenador@nexusops.com"

        logout_response = await ac.post("/api/v1/auth/logout")
        assert logout_response.status_code == 204
        assert (await ac.get("/api/v1/dashboard/strategic")).status_code == 401


@pytest.mark.asyncio
async def test_mobile_login_uses_shift_length_session():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "coordenador@nexusops.com",
                "password": "senha123",
                "client": "mobile",
            },
        )

    assert response.status_code == 200
    claims = decode_access_token(response.json()["access_token"])
    remaining_seconds = claims["exp"] - datetime.now(UTC).timestamp()
    assert 11 * 60 * 60 < remaining_seconds <= 12 * 60 * 60


@pytest.mark.asyncio
async def test_idempotent_sync_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/login",
            json={"email": "coordenador@nexusops.com", "password": "senha123"},
        )
        payload = {
            "items": [
                {
                    "id": "8f4a12b9-3c7d-4e9f-9a1b-0248a356e719",
                    "entityType": "INSPECTION",
                    "payload": {"title": "Vistoria Fiat Strada", "vehiclePlate": "ABC-1234"},
                    "createdAt": "2026-07-23T14:00:00Z",
                    "status": "PENDING"
                }
            ]
        }

        # Envio 1
        resp1 = await ac.post("/api/v1/inspections/sync", json=payload)
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["syncedCount"] == 1

        # Envio 2 (Mesmo UUID -> Idempotência ativada sem duplicar no banco)
        resp2 = await ac.post("/api/v1/inspections/sync", json=payload)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["syncedCount"] == 0
        assert "Idempotente" in data2["results"][0]["message"]

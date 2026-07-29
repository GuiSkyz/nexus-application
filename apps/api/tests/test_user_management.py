import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_master_can_manage_users_and_director_cannot_assign_master(client):
    created_response = await client.post(
        "/api/v1/users",
        json={
            "fullName": "Diretora de Operações",
            "email": "diretora@example.com",
            "role": "DIRETOR",
            "temporaryPassword": "DiretoraTeste123!",
            "isActive": True,
        },
    )
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["role"] == "DIRETOR"

    updated_response = await client.put(
        f"/api/v1/users/{created['id']}",
        json={
            "fullName": "Diretora Operacional",
            "email": created["email"],
            "role": created["role"],
            "isActive": created["isActive"],
            "temporaryPassword": None,
        },
    )
    assert updated_response.status_code == 200
    assert updated_response.json()["fullName"] == "Diretora Operacional"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as director:
        login_response = await director.post(
            "/api/v1/auth/login",
            json={
                "email": "diretora@example.com",
                "password": "DiretoraTeste123!",
            },
        )
        assert login_response.status_code == 200
        forbidden = await director.post(
            "/api/v1/users",
            json={
                "fullName": "Outro Master",
                "email": "outro.master@example.com",
                "role": "MASTER",
                "temporaryPassword": "OutroMaster123!",
                "isActive": True,
            },
        )
        assert forbidden.status_code == 403

        allowed = await director.post(
            "/api/v1/users",
            json={
                "fullName": "Nova Supervisora",
                "email": "supervisora@example.com",
                "role": "SUPERVISOR",
                "temporaryPassword": "Supervisora123!",
                "isActive": True,
            },
        )
        assert allowed.status_code == 201

    assert (await client.delete(f"/api/v1/users/{created['id']}")).status_code == 204


@pytest.mark.asyncio
async def test_regular_user_cannot_manage_users():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as coordinator:
        await coordinator.post(
            "/api/v1/auth/login",
            json={"email": "coordenador@nexusops.com", "password": "senha123"},
        )
        response = await coordinator.get("/api/v1/users")
        assert response.status_code == 403

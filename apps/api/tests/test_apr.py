import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def signature_payload(name: str) -> dict:
    return {
        "signerName": name,
        "signedAt": "2026-07-23T14:00:00Z",
        "strokes": [[{"x": 10, "y": 20}, {"x": 80, "y": 30}]],
    }


@pytest.mark.asyncio
async def test_apr_requires_supervisor_authorization_before_activity_start():
    transport = ASGITransport(app=app)
    payload = {
        "clientGeneratedId": "f5a0de0d-c26d-442e-8448-e13fb17852d1",
        "serviceOrderNumber": "OS-8849",
        "activityId": "activity-8849",
        "activityType": "NR35",
        "location": "Av. Paulista, 1500",
        "technicianId": "tech-01",
        "technicianName": "João Souza",
        "teamName": "Equipe Alfa",
        "plannedStart": "2026-07-23T15:00:00Z",
        "requiredPpe": ["Cinto paraquedista", "Talabarte duplo", "Capacete com jugular"],
        "weatherConditions": "Tempo firme, vento fraco.",
        "emergencyContact": "Supervisão: (11) 99999-0000",
        "risks": [
            {
                "hazard": "Queda de altura",
                "probability": 4,
                "severity": 5,
                "controls": ["Linha de vida", "Ancoragem inspecionada"],
                "residualProbability": 2,
                "residualSeverity": 5,
            }
        ],
        "technicianSignature": signature_payload("João Souza"),
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post("/api/v1/apr", json=payload)
        assert create_response.status_code == 201
        created = create_response.json()
        assert created["status"] == "PENDING_AUTHORIZATION"
        assert created["canStartActivity"] is False
        assert created["maximumRiskLevel"] == "CRITICO"
        assert created["maximumResidualRiskLevel"] == "ALTO"

        authorize_response = await client.post(
            f"/api/v1/apr/{created['id']}/authorize",
            json={
                "supervisorId": "sup-01",
                "supervisorName": "Juliana Lima",
                "notes": "Controles conferidos por chamada de vídeo.",
                "signature": signature_payload("Juliana Lima"),
            },
        )
        assert authorize_response.status_code == 200
        authorized = authorize_response.json()
        assert authorized["status"] == "AUTHORIZED"
        assert authorized["canStartActivity"] is True
        assert authorized["authorizedBy"] == "Juliana Lima"


@pytest.mark.asyncio
async def test_apr_rejects_residual_risk_higher_than_initial_risk():
    transport = ASGITransport(app=app)
    payload = {
        "clientGeneratedId": "fdcdcae8-58f0-4f14-b7e4-fc5a770bb0c1",
        "serviceOrderNumber": "OS-1000",
        "activityId": "activity-1000",
        "activityType": "NR10",
        "location": "Rua A, 10",
        "technicianId": "tech-02",
        "technicianName": "Carlos Silva",
        "teamName": "Equipe Beta",
        "plannedStart": "2026-07-23T16:00:00Z",
        "requiredPpe": ["Luva isolante"],
        "weatherConditions": "Tempo firme.",
        "emergencyContact": "Supervisão",
        "risks": [
            {
                "hazard": "Choque elétrico",
                "probability": 2,
                "severity": 3,
                "controls": ["Desenergização"],
                "residualProbability": 4,
                "residualSeverity": 4,
            }
        ],
        "technicianSignature": signature_payload("Carlos Silva"),
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/apr", json=payload)

    assert response.status_code == 422

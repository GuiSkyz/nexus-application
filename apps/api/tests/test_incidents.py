import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_incidents(client: AsyncClient) -> None:
    response = await client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_create_action_plan_and_resolve(client: AsyncClient) -> None:
    plan_req = {
        "description": "Troca de resina e fibra do degrau rachado",
        "assignedTo": "Oficina de Escadas Credenciada",
        "dueDate": "2026-07-25T18:00:00Z",
        "createdBy": "Supervisor Operacional",
    }
    res1 = await client.post("/api/v1/incidents/NC-2026-085/action-plan", json=plan_req)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "PLANO_DE_ACAO"
    assert data1["actionPlan"]["assignedTo"] == "Oficina de Escadas Credenciada"

    resolve_req = {"resolutionNotes": "Escada reparada e laudo de carga aprovado."}
    res2 = await client.post("/api/v1/incidents/NC-2026-085/resolve", json=resolve_req)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "RESOLVIDA"


@pytest.mark.asyncio
async def test_audit_nonconformity_uses_the_selected_inspection_question(
    client: AsyncClient,
) -> None:
    inspections = await client.get("/api/v1/inspections/audit")
    inspection = inspections.json()[0]
    detail = await client.get(f"/api/v1/inspections/audit/{inspection['id']}")
    question_id = detail.json()["answers"][0]["questionId"]

    created = await client.post(
        f"/api/v1/inspections/audit/{inspection['id']}/nonconformity",
        json={
            "questionId": question_id,
            "description": "Divergência identificada durante a auditoria.",
            "severity": "ALTA",
        },
    )

    assert created.status_code == 200
    incidents = await client.get("/api/v1/incidents")
    incident = next(item for item in incidents.json() if item["id"] == created.json()["code"])
    assert incident["technicianName"] == inspection["technicianName"]
    assert incident["questionText"] == question_id


@pytest.mark.asyncio
async def test_audit_nonconformity_rejects_a_question_from_another_checklist(
    client: AsyncClient,
) -> None:
    inspections = (await client.get("/api/v1/inspections/audit")).json()
    detail = await client.get(f"/api/v1/inspections/audit/{inspections[1]['id']}")

    response = await client.post(
        f"/api/v1/inspections/audit/{inspections[0]['id']}/nonconformity",
        json={
            "questionId": detail.json()["answers"][0]["questionId"],
            "description": "Questão de outra inspeção.",
        },
    )

    assert response.status_code == 422

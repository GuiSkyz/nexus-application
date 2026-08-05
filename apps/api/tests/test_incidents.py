import pytest
from httpx import AsyncClient

from app.infrastructure.minio.report_storage import get_report_storage
from app.main import app


class FakeEvidenceStorage:
    async def upload_bytes(self, content: bytes, object_key: str, content_type: str) -> str:
        return object_key

    async def download_bytes(self, object_key: str) -> tuple[bytes, str]:
        return b"foto-teste", "image/jpeg"


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
        "dueDate": "2026-07-25T18:00:00Z",
        "createdBy": "Supervisor Operacional",
    }
    res1 = await client.post("/api/v1/incidents/NC-2026-085/action-plan", json=plan_req)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "PLANO_DE_ACAO"
    assert data1["actionPlan"]["assignedTo"] == "João Silva"
    assert data1["actionPlan"]["assignedTechnicianId"] is not None

    technician_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "tecnico1@example.com", "password": "TecnicoTeste123!"},
    )
    assert technician_login.status_code == 200
    app.dependency_overrides[get_report_storage] = lambda: FakeEvidenceStorage()
    try:
        submitted = await client.post(
            "/api/v1/incidents/NC-2026-085/submit-review",
            json={
                "resolutionNotes": "Escada reparada e testada em campo.",
                "evidenceDataUrl": "data:image/jpeg;base64,Zm90by10ZXN0ZQ==",
            },
        )
    finally:
        app.dependency_overrides.pop(get_report_storage, None)
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "EM_ANALISE"

    app.dependency_overrides[get_report_storage] = lambda: FakeEvidenceStorage()
    try:
        evidence = await client.get("/api/v1/incidents/NC-2026-085/evidence")
    finally:
        app.dependency_overrides.pop(get_report_storage, None)
    assert evidence.status_code == 200
    assert evidence.headers["content-type"] == "image/jpeg"
    assert evidence.content == b"foto-teste"

    master_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "master@nexusops.com", "password": "MasterTeste123!"},
    )
    assert master_login.status_code == 200
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
            "actionPlanDescription": "Corrigir a divergência e registrar evidência.",
            "actionPlanDueDate": "2026-08-10T18:00:00",
        },
    )

    assert created.status_code == 200
    incidents = await client.get("/api/v1/incidents")
    incident = next(item for item in incidents.json() if item["id"] == created.json()["code"])
    assert incident["technicianName"] == inspection["technicianName"]
    assert incident["questionText"] == question_id
    assert incident["status"] == "PLANO_DE_ACAO"
    assert incident["actionPlan"]["assignedTo"] == inspection["technicianName"]

    duplicate = await client.post(
        f"/api/v1/inspections/audit/{inspection['id']}/nonconformity",
        json={
            "questionId": question_id,
            "description": "Tentativa de duplicar a mesma não conformidade.",
            "severity": "ALTA",
            "actionPlanDescription": "Este plano não deve ser criado.",
            "actionPlanDueDate": "2026-08-11T18:00:00",
        },
    )
    assert duplicate.status_code == 409


@pytest.mark.asyncio
async def test_manual_nonconformity_requires_plan_and_rejects_duplicate_question(
    client: AsyncClient,
) -> None:
    technician = (await client.get("/api/v1/technicians")).json()[0]
    payload = {
        "inspectionTitle": "Registro manual",
        "contextType": "ACTIVITY",
        "technicianId": technician["id"],
        "questionText": "O isolamento da área está correto?",
        "category": "SEGURANÇA",
        "severity": "ALTA",
        "description": "Isolamento incompleto.",
        "actionPlan": {
            "description": "Refazer o isolamento e registrar evidência.",
            "dueDate": "2026-08-10T18:00:00",
            "createdBy": "Gestão Operacional",
        },
    }

    created = await client.post("/api/v1/incidents", json=payload)
    assert created.status_code == 201
    assert created.json()["status"] == "PLANO_DE_ACAO"
    assert created.json()["actionPlan"]["description"] == payload["actionPlan"]["description"]
    assert created.json()["actionPlan"]["assignedTechnicianId"] == technician["id"]

    duplicate = await client.post("/api/v1/incidents", json=payload)
    assert duplicate.status_code == 409


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

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_technician_and_vehicle_crud(client: AsyncClient) -> None:
    technician_response = await client.post(
        "/api/v1/technicians",
        json={
            "fullName": "Ana Técnica",
            "email": "ana.tecnica@example.com",
            "employeeCode": "TEC-900",
            "phone": "(11) 99999-0000",
            "teamName": "Equipe Delta",
            "specialty": "Fibra óptica",
            "isActive": True,
            "temporaryPassword": "SenhaSegura123",
        },
    )
    assert technician_response.status_code == 201
    technician = technician_response.json()

    vehicle_response = await client.post(
        "/api/v1/vehicles",
        json={
            "model": "Fiat Strada",
            "plate": "TST1A23",
            "year": 2025,
            "currentKm": 1200,
            "category": "INSTALACAO",
            "status": "DISPONIVEL",
            "assignedTechnicianId": technician["id"],
        },
    )
    assert vehicle_response.status_code == 201
    vehicle = vehicle_response.json()
    assert vehicle["assignedTechnicianName"] == "Ana Técnica"

    vehicle["currentKm"] = 1500
    updated = await client.put(f"/api/v1/vehicles/{vehicle['id']}", json=vehicle)
    assert updated.status_code == 200
    assert updated.json()["currentKm"] == 1500

    assert (await client.delete(f"/api/v1/vehicles/{vehicle['id']}")).status_code == 204
    assert (
        await client.delete(f"/api/v1/technicians/{technician['id']}")
    ).status_code == 204


@pytest.mark.asyncio
async def test_checklist_crud_and_lifecycle(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/checklists",
        json={
            "title": "Checklist de teste integrado",
            "category": "Operação",
            "description": "Valida o ciclo completo.",
            "createdBy": "Testes",
            "sections": [
                {
                    "title": "Segurança",
                    "order": 1,
                    "questions": [
                        {
                            "text": "Os EPIs estão em conformidade?",
                            "type": "yes_no",
                            "isRequired": True,
                            "requirePhoto": False,
                            "requireJustification": True,
                            "order": 1,
                        }
                    ],
                }
            ],
        },
    )
    assert response.status_code == 201
    checklist = response.json()
    assert checklist["sections"][0]["questions"][0]["text"].startswith("Os EPIs")

    checklist["description"] = "Descrição atualizada."
    updated = await client.put(
        f"/api/v1/checklists/{checklist['id']}", json=checklist
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Descrição atualizada."

    published = await client.post(f"/api/v1/checklists/{checklist['id']}/publish")
    assert published.status_code == 200
    assert published.json()["status"] == "published"

    duplicated = await client.post(
        f"/api/v1/checklists/{checklist['id']}/duplicate"
    )
    assert duplicated.status_code == 200
    clone = duplicated.json()
    assert clone["status"] == "draft"
    assert (await client.delete(f"/api/v1/checklists/{clone['id']}")).status_code == 204


@pytest.mark.asyncio
async def test_settings_and_incident_crud(client: AsyncClient) -> None:
    settings = (await client.get("/api/v1/settings")).json()
    settings["organizationName"] = "Operação Teste"
    settings["checklistReminderHour"] = 6
    updated_settings = await client.put("/api/v1/settings", json=settings)
    assert updated_settings.status_code == 200
    assert updated_settings.json()["organizationName"] == "Operação Teste"

    created = await client.post(
        "/api/v1/incidents",
        json={
            "inspectionTitle": "Registro manual",
            "contextType": "ACTIVITY",
            "technicianName": "Ana Técnica",
            "teamName": "Equipe Delta",
            "questionText": "Sinalização ausente",
            "category": "SEGURANÇA",
            "severity": "ALTA",
            "status": "ABERTA",
            "description": "Área sem isolamento.",
        },
    )
    assert created.status_code == 201
    incident = created.json()
    incident["description"] = "Área isolada parcialmente."
    updated = await client.put(f"/api/v1/incidents/{incident['id']}", json=incident)
    assert updated.status_code == 200
    assert updated.json()["description"] == "Área isolada parcialmente."
    assert (
        await client.delete(f"/api/v1/incidents/{incident['id']}")
    ).status_code == 204


@pytest.mark.asyncio
async def test_strategic_dashboard_uses_database(client: AsyncClient) -> None:
    response = await client.get("/api/v1/dashboard/strategic")
    assert response.status_code == 200
    dashboard = response.json()
    assert dashboard["overview"]["inspectionsPeriod"] >= 3
    assert dashboard["overview"]["activeTechnicians"] >= 3
    assert len(dashboard["activity"]) == 7

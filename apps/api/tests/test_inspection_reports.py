import hashlib

import pytest
from httpx import ASGITransport, AsyncClient

from app.infrastructure.minio.report_storage import get_report_storage
from app.main import app


class FakeReportStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    async def upload_pdf(self, content: bytes, object_key: str) -> str:
        self.objects[object_key] = content
        return object_key

    async def generate_download_url(self, object_key: str) -> str:
        return f"https://storage.test/{object_key}"


@pytest.mark.asyncio
async def test_generate_inspection_report_and_store_in_object_storage():
    storage = FakeReportStorage()
    app.dependency_overrides[get_report_storage] = lambda: storage
    transport = ASGITransport(app=app)
    payload = {
        "title": "Vistoria diária de saída",
        "technicianName": "João Souza",
        "completedAt": "2026-07-23T14:00:00Z",
        "templateVersion": "1.0",
        "vehiclePlate": "ABC1D23",
        "vehicleModel": "Fiat Strada",
        "notes": "Sem observações adicionais.",
        "answers": [
            {
                "category": "Segurança",
                "question": "Os pneus estão em condições adequadas?",
                "value": "CONFORME",
            }
        ],
        "evidences": [],
        "signature": {
            "signerName": "João Souza",
            "signedAt": "2026-07-23T14:01:00Z",
            "strokes": [
                [
                    {"x": 10, "y": 30},
                    {"x": 45, "y": 12},
                    {"x": 90, "y": 32},
                ]
            ],
        },
    }

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/inspections/insp-001/report",
                json=payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    pdf_content = storage.objects[body["objectKey"]]
    assert pdf_content.startswith(b"%PDF")
    assert body["sha256"] == hashlib.sha256(pdf_content).hexdigest()
    assert body["downloadUrl"].startswith("https://storage.test/")

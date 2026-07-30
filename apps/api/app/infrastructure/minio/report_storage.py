import io
from datetime import timedelta

from fastapi.concurrency import run_in_threadpool

from app.application.interfaces.storage import ReportStorage
from app.core.config import get_settings
from app.infrastructure.minio.client import get_minio_client


class MinioReportStorage:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_minio_client()

    async def upload_bytes(
        self, content: bytes, object_key: str, content_type: str
    ) -> str:
        stream = io.BytesIO(content)
        await run_in_threadpool(
            self.client.put_object,
            self.settings.MINIO_DEFAULT_BUCKET,
            object_key,
            stream,
            len(content),
            content_type,
        )
        return object_key

    async def upload_pdf(self, content: bytes, object_key: str) -> str:
        return await self.upload_bytes(content, object_key, "application/pdf")

    async def generate_download_url(self, object_key: str) -> str:
        return await run_in_threadpool(
            self.client.presigned_get_object,
            self.settings.MINIO_DEFAULT_BUCKET,
            object_key,
            timedelta(hours=1),
        )


def get_report_storage() -> ReportStorage:
    return MinioReportStorage()

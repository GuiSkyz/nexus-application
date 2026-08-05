import io
from datetime import timedelta
from urllib.parse import urlsplit, urlunsplit

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
        signed_url = await run_in_threadpool(
            self.client.presigned_get_object,
            self.settings.MINIO_DEFAULT_BUCKET,
            object_key,
            timedelta(hours=1),
        )
        public_endpoint = self.settings.MINIO_PUBLIC_ENDPOINT.rstrip("/")
        if not public_endpoint:
            return signed_url
        public_parts = urlsplit(public_endpoint)
        signed_parts = urlsplit(signed_url)
        return urlunsplit(
            (
                public_parts.scheme or signed_parts.scheme,
                public_parts.netloc or signed_parts.netloc,
                signed_parts.path,
                signed_parts.query,
                signed_parts.fragment,
            )
        )

    async def download_bytes(self, object_key: str) -> tuple[bytes, str]:
        response = await run_in_threadpool(
            self.client.get_object,
            self.settings.MINIO_DEFAULT_BUCKET,
            object_key,
        )
        try:
            content = await run_in_threadpool(response.read)
            content_type = response.headers.get("Content-Type", "application/octet-stream")
            return content, content_type
        finally:
            await run_in_threadpool(response.close)
            await run_in_threadpool(response.release_conn)


def get_report_storage() -> ReportStorage:
    return MinioReportStorage()

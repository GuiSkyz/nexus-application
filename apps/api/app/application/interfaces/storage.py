from abc import ABC, abstractmethod
from typing import BinaryIO, Protocol


class IStorageService(ABC):
    """Armazenamento de objetos pesados: fotos, assinaturas e relatórios."""

    @abstractmethod
    async def upload_file(self, file_stream: BinaryIO, object_name: str, content_type: str) -> str:
        pass

    @abstractmethod
    async def download_file(self, object_name: str) -> BinaryIO:
        pass

    @abstractmethod
    async def generate_presigned_url(self, object_name: str, expires_in_seconds: int = 3600) -> str:
        pass

    @abstractmethod
    async def delete_file(self, object_name: str) -> bool:
        pass


class ReportStorage(Protocol):
    async def upload_bytes(
        self, content: bytes, object_key: str, content_type: str
    ) -> str:
        ...

    async def upload_pdf(self, content: bytes, object_key: str) -> str:
        ...

    async def generate_download_url(self, object_key: str) -> str:
        ...

    async def download_bytes(self, object_key: str) -> tuple[bytes, str]:
        ...

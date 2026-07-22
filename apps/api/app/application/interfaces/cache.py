from abc import ABC, abstractmethod
from typing import Any, Optional


class ICacheService(ABC):
    """Interface abstrata para serviços de cache, rate limiting e revogação de tokens."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    async def set(self, key: str, value: str, ttl_seconds: Optional[int] = None) -> bool:
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        pass

    @abstractmethod
    async def is_token_revoked(self, jti_or_token: str) -> bool:
        pass

    @abstractmethod
    async def revoke_token(self, jti_or_token: str, ttl_seconds: int) -> bool:
        pass

import uuid
from datetime import datetime, timezone
from typing import Any


def generate_uuid() -> str:
    """Gera UUIDv4 padronizado no formato string."""
    return str(uuid.uuid4())


def get_current_utc_timestamp() -> datetime:
    """Retorna datetime UTC com timezone ciente (timezone-aware)."""
    return datetime.now(timezone.utc)

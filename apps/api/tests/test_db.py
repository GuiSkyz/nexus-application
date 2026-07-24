from app.infrastructure.database.base import Base
from app.infrastructure.database.models import SystemMetadata


def test_system_metadata_tablename_and_columns() -> None:
    """Verifica se a entidade técnica de teste possui nome de tabela e colunas corretas para migrations."""
    assert SystemMetadata.__tablename__ == "sys_metadata"
    assert "key" in SystemMetadata.__table__.columns
    assert "value" in SystemMetadata.__table__.columns
    assert "id" in SystemMetadata.__table__.columns
    assert "created_at" in SystemMetadata.__table__.columns
    assert "updated_at" in SystemMetadata.__table__.columns


def test_base_metadata_registered_entities() -> None:
    """Verifica se os metadados do SQLAlchemy registraram corretamente as tabelas do domínio."""
    registered_tables = list(Base.metadata.tables.keys())
    assert {
        "sys_metadata",
        "users",
        "vehicles",
        "checklist_templates",
        "inspections",
        "inspection_reports",
        "apr_assessments",
        "incidents",
    }.issubset(registered_tables)

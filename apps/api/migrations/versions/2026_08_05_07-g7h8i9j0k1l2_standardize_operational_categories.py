"""standardize operational categories

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-05 11:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "g7h8i9j0k1l2"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "operational_category",
            sa.String(length=50),
            nullable=False,
            server_default="INSTALACAO_MANUTENCAO",
        ),
    )
    op.alter_column("users", "operational_category", server_default=None)

    op.execute(
        "UPDATE vehicles SET category = 'INSTALACAO_MANUTENCAO' "
        "WHERE category IN ('INSTALACAO', 'MANUTENCAO_FIBRA', 'SUPERVISAO')"
    )
    op.execute(
        "UPDATE checklist_templates SET category = 'INFRAESTRUTURA' "
        "WHERE LOWER(category) LIKE '%infraestrutura%'"
    )
    op.execute(
        "UPDATE checklist_templates SET category = 'INSTALACAO_MANUTENCAO' "
        "WHERE category <> 'INFRAESTRUTURA'"
    )


def downgrade() -> None:
    op.drop_column("users", "operational_category")

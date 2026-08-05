"""checklist distribution scope

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-08-05 12:00:00.000000
"""

from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "i9j0k1l2m3n4"
down_revision: str | None = "h8i9j0k1l2m3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.add_column("checklist_templates", sa.Column("distribution_scope", sa.String(length=20), nullable=False, server_default="INDIVIDUAL"))
    op.alter_column("checklist_templates", "distribution_scope", server_default=None)

def downgrade() -> None:
    op.drop_column("checklist_templates", "distribution_scope")

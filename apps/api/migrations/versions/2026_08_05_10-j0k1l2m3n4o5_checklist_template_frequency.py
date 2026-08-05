"""store checklist periodicity on the template

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-08-05 14:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "j0k1l2m3n4o5"
down_revision: str | None = "i9j0k1l2m3n4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "checklist_templates",
        sa.Column("frequency", sa.String(length=20), nullable=False, server_default="DAILY"),
    )
    op.alter_column("checklist_templates", "frequency", server_default=None)


def downgrade() -> None:
    op.drop_column("checklist_templates", "frequency")

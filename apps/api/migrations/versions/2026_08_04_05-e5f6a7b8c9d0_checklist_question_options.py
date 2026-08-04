"""checklist_question_options

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-04 18:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "checklist_questions",
        sa.Column("options", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.alter_column("checklist_questions", "options", server_default=None)


def downgrade() -> None:
    op.drop_column("checklist_questions", "options")

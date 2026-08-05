"""store technician evidence for action-plan review"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "l2m3n4o5p6q7"
down_revision: str | None = "k1l2m3n4o5p6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | None = None

def upgrade() -> None:
    op.add_column("action_plans", sa.Column("evidence_photo_url", sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column("action_plans", "evidence_photo_url")

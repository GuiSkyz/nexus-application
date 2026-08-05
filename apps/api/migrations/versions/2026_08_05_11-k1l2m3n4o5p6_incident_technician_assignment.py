"""link incidents to registered technicians

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-08-05 15:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "k1l2m3n4o5p6"
down_revision: str | None = "j0k1l2m3n4o5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("technician_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_incidents_technician_id_users", "incidents", "users", ["technician_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index("ix_incidents_technician_id", "incidents", ["technician_id"])
    op.execute(
        """
        UPDATE incidents AS incident
        SET technician_id = technician.id
        FROM users AS technician
        WHERE technician.role = 'TECNICO'
          AND technician.full_name = incident.technician_name
          AND (SELECT count(*) FROM users matching
               WHERE matching.role = 'TECNICO' AND matching.full_name = incident.technician_name) = 1
        """
    )


def downgrade() -> None:
    op.drop_index("ix_incidents_technician_id", table_name="incidents")
    op.drop_constraint("fk_incidents_technician_id_users", "incidents", type_="foreignkey")
    op.drop_column("incidents", "technician_id")

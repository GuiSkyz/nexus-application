"""mobile_inspection_persistence

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-29 21:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "c3d4e5f6a7b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "inspections", sa.Column("technician_id", sa.String(36), nullable=True)
    )
    op.add_column("inspections", sa.Column("vehicle_id", sa.String(36), nullable=True))
    op.add_column(
        "inspections",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_inspections_technician_id_users",
        "inspections",
        "users",
        ["technician_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_inspections_vehicle_id_vehicles",
        "inspections",
        "vehicles",
        ["vehicle_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_inspections_technician_id", "inspections", ["technician_id"]
    )
    op.create_index("ix_inspections_vehicle_id", "inspections", ["vehicle_id"])

    op.add_column(
        "evidences", sa.Column("content_type", sa.String(100), nullable=True)
    )
    op.add_column("evidences", sa.Column("sha256", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("evidences", "sha256")
    op.drop_column("evidences", "content_type")
    op.drop_index("ix_inspections_vehicle_id", table_name="inspections")
    op.drop_index("ix_inspections_technician_id", table_name="inspections")
    op.drop_constraint(
        "fk_inspections_vehicle_id_vehicles", "inspections", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_inspections_technician_id_users", "inspections", type_="foreignkey"
    )
    op.drop_column("inspections", "completed_at")
    op.drop_column("inspections", "vehicle_id")
    op.drop_column("inspections", "technician_id")

"""platform foundation

Revision ID: 0001_platform_foundation
Revises:
Create Date: 2026-06-08
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_platform_foundation"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("tenant_id", sa.String(80), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("code", sa.String(80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code"),
    )
    op.create_table(
        "module_records",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("tenant_id", sa.String(80), nullable=False, index=True),
        sa.Column("company_id", sa.String(80), nullable=True, index=True),
        sa.Column("plant_id", sa.String(80), nullable=True, index=True),
        sa.Column("module_key", sa.String(80), nullable=False, index=True),
        sa.Column("record_type", sa.String(80), nullable=False, index=True),
        sa.Column("record_code", sa.String(120), nullable=False, index=True),
        sa.Column("name", sa.String(250), nullable=False),
        sa.Column("status", sa.String(60), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("module_records")
    op.drop_table("companies")


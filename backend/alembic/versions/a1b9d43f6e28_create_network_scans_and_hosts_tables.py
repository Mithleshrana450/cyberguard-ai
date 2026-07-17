"""create network_scans and network_hosts tables

Revision ID: a1b9d43f6e28
Revises: f6a3c82e0b17
Create Date: 2026-07-17 10:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a1b9d43f6e28"
down_revision = "f6a3c82e0b17"
branch_labels = None
depends_on = None


def upgrade() -> None:
    status_enum = postgresql.ENUM("completed", "failed", name="networkscanstatus")
    status_enum.create(op.get_bind())

    op.create_table(
        "network_scans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_range", sa.String(64), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("completed", "failed", name="networkscanstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("hosts_scanned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hosts_up", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_network_scans_user_id", "network_scans", ["user_id"])
    op.create_index("ix_network_scans_created_at", "network_scans", ["created_at"])

    op.create_table(
        "network_hosts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("network_scans.id"), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=False),
        sa.Column("is_up", sa.Boolean(), nullable=False),
        sa.Column("hostname", sa.String(255), nullable=True),
        sa.Column("open_ports_json", sa.Text(), nullable=False, server_default="[]"),
    )
    op.create_index("ix_network_hosts_scan_id", "network_hosts", ["scan_id"])


def downgrade() -> None:
    op.drop_table("network_hosts")
    op.drop_table("network_scans")
    postgresql.ENUM(name="networkscanstatus").drop(op.get_bind())

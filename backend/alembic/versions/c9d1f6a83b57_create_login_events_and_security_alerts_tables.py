"""create login_events and security_alerts tables

Revision ID: c9d1f6a83b57
Revises: a7c3e91b4f2d
Create Date: 2026-07-16 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c9d1f6a83b57"
down_revision = "a7c3e91b4f2d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    alert_severity_enum = postgresql.ENUM("critical", "high", "medium", "low", name="alertseverity")
    alert_severity_enum.create(op.get_bind())

    alert_type_enum = postgresql.ENUM("brute_force_login", name="alerttype")
    alert_type_enum.create(op.get_bind())

    op.create_table(
        "login_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("email_attempted", sa.String(255), nullable=False),
        sa.Column("ip_address", sa.String(64), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_login_events_user_id", "login_events", ["user_id"])
    op.create_index("ix_login_events_ip_address", "login_events", ["ip_address"])
    op.create_index("ix_login_events_created_at", "login_events", ["created_at"])

    op.create_table(
        "security_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "alert_type",
            postgresql.ENUM("brute_force_login", name="alerttype", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "severity",
            postgresql.ENUM("critical", "high", "medium", "low", name="alertseverity", create_type=False),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("source_ip", sa.String(64), nullable=False),
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_security_alerts_source_ip", "security_alerts", ["source_ip"])
    op.create_index("ix_security_alerts_created_at", "security_alerts", ["created_at"])


def downgrade() -> None:
    op.drop_table("security_alerts")
    op.drop_table("login_events")
    postgresql.ENUM(name="alerttype").drop(op.get_bind())
    postgresql.ENUM(name="alertseverity").drop(op.get_bind())

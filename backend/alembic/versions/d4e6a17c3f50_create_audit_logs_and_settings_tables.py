"""create audit_logs and platform_settings tables

Revision ID: d4e6a17c3f50
Revises: c3d5f06b2e49
Create Date: 2026-07-18 09:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d4e6a17c3f50"
down_revision = "c3d5f06b2e49"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("details", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    platform_settings_table = sa.table(
        "platform_settings",
        sa.column("key", sa.String),
        sa.column("value", sa.String),
        sa.column("description", sa.Text),
    )
    op.bulk_insert(
        platform_settings_table,
        [
            {
                "key": "brute_force_threshold",
                "value": "5",
                "description": "Number of failed login attempts from one IP within 5 minutes "
                "that triggers a SIEM alert.",
            },
            {
                "key": "platform_name",
                "value": "CyberGuard AI",
                "description": "Display name shown in the UI. (Informational only - not yet "
                "wired to the frontend.)",
            },
            {
                "key": "support_email",
                "value": "support@example.com",
                "description": "Contact email shown to users. (Informational only - not yet "
                "wired to the frontend.)",
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("platform_settings")
    op.drop_table("audit_logs")

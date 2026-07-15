"""create threat_lookups table

Revision ID: d4e8b25c9a16
Revises: c9d1f6a83b57
Create Date: 2026-07-16 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d4e8b25c9a16"
down_revision = "c9d1f6a83b57"
branch_labels = None
depends_on = None


def upgrade() -> None:
    lookup_type_enum = postgresql.ENUM("ip", "domain", "url", "hash", name="lookuptype")
    lookup_type_enum.create(op.get_bind())

    verdict_enum = postgresql.ENUM("malicious", "suspicious", "clean", "unknown", name="verdict")
    verdict_enum.create(op.get_bind())

    op.create_table(
        "threat_lookups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "lookup_type",
            postgresql.ENUM("ip", "domain", "url", "hash", name="lookuptype", create_type=False),
            nullable=False,
        ),
        sa.Column("query_value", sa.String(2048), nullable=False),
        sa.Column(
            "verdict",
            postgresql.ENUM("malicious", "suspicious", "clean", "unknown", name="verdict", create_type=False),
            nullable=False,
        ),
        sa.Column("malicious_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("suspicious_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_engines", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_threat_lookups_user_id", "threat_lookups", ["user_id"])
    op.create_index("ix_threat_lookups_created_at", "threat_lookups", ["created_at"])


def downgrade() -> None:
    op.drop_table("threat_lookups")
    postgresql.ENUM(name="verdict").drop(op.get_bind())
    postgresql.ENUM(name="lookuptype").drop(op.get_bind())

"""create phishing_analyses table

Revision ID: f6a3c82e0b17
Revises: e5f2a71d3c94
Create Date: 2026-07-17 09:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f6a3c82e0b17"
down_revision = "e5f2a71d3c94"
branch_labels = None
depends_on = None


def upgrade() -> None:
    analysis_type_enum = postgresql.ENUM("url", "email", name="analysistype")
    analysis_type_enum.create(op.get_bind())

    risk_level_enum = postgresql.ENUM("low", "medium", "high", "critical", name="risklevel")
    risk_level_enum.create(op.get_bind())

    op.create_table(
        "phishing_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "analysis_type",
            postgresql.ENUM("url", "email", name="analysistype", create_type=False),
            nullable=False,
        ),
        sa.Column("input_preview", sa.String(320), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column(
            "risk_level",
            postgresql.ENUM("low", "medium", "high", "critical", name="risklevel", create_type=False),
            nullable=False,
        ),
        sa.Column("findings_json", sa.Text(), nullable=False),
        sa.Column("ai_explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_phishing_analyses_user_id", "phishing_analyses", ["user_id"])
    op.create_index("ix_phishing_analyses_created_at", "phishing_analyses", ["created_at"])


def downgrade() -> None:
    op.drop_table("phishing_analyses")
    postgresql.ENUM(name="risklevel").drop(op.get_bind())
    postgresql.ENUM(name="analysistype").drop(op.get_bind())

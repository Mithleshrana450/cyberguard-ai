"""create scans and scan_findings tables

Revision ID: a7c3e91b4f2d
Revises: f48ffe74e71d
Create Date: 2026-07-15 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a7c3e91b4f2d"
down_revision = "f48ffe74e71d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    scan_status_enum = postgresql.ENUM("pending", "running", "completed", "failed", name="scanstatus")
    scan_status_enum.create(op.get_bind())

    finding_severity_enum = postgresql.ENUM(
        "critical", "high", "medium", "low", "info", name="findingseverity"
    )
    finding_severity_enum.create(op.get_bind())

    finding_category_enum = postgresql.ENUM("headers", "tls", "robots", "disclosure", name="findingcategory")
    finding_category_enum.create(op.get_bind())

    op.create_table(
        "scans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_url", sa.String(2048), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("pending", "running", "completed", "failed", name="scanstatus", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("security_score", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_scans_user_id", "scans", ["user_id"])

    op.create_table(
        "scan_findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scans.id"), nullable=False),
        sa.Column(
            "category",
            postgresql.ENUM("headers", "tls", "robots", "disclosure", name="findingcategory", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "severity",
            postgresql.ENUM(
                "critical", "high", "medium", "low", "info", name="findingseverity", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
    )
    op.create_index("ix_scan_findings_scan_id", "scan_findings", ["scan_id"])


def downgrade() -> None:
    op.drop_table("scan_findings")
    op.drop_table("scans")
    postgresql.ENUM(name="findingcategory").drop(op.get_bind())
    postgresql.ENUM(name="findingseverity").drop(op.get_bind())
    postgresql.ENUM(name="scanstatus").drop(op.get_bind())

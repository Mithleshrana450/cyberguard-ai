"""create incidents and incident_notes tables

Revision ID: c3d5f06b2e49
Revises: b2c4e95a1d38
Create Date: 2026-07-17 18:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c3d5f06b2e49"
down_revision = "b2c4e95a1d38"
branch_labels = None
depends_on = None


def upgrade() -> None:
    status_enum = postgresql.ENUM("open", "investigating", "resolved", "closed", name="incidentstatus")
    status_enum.create(op.get_bind())

    severity_enum = postgresql.ENUM("critical", "high", "medium", "low", name="incidentseverity")
    severity_enum.create(op.get_bind())

    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("open", "investigating", "resolved", "closed", name="incidentstatus", create_type=False),
            nullable=False,
            server_default="open",
        ),
        sa.Column(
            "severity",
            postgresql.ENUM("critical", "high", "medium", "low", name="incidentseverity", create_type=False),
            nullable=False,
        ),
        sa.Column("source_type", sa.String(64), nullable=True),
        sa.Column("source_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_incidents_created_by", "incidents", ["created_by"])
    op.create_index("ix_incidents_assigned_to", "incidents", ["assigned_to"])
    op.create_index("ix_incidents_created_at", "incidents", ["created_at"])

    op.create_table(
        "incident_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("incidents.id"), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_incident_notes_incident_id", "incident_notes", ["incident_id"])


def downgrade() -> None:
    op.drop_table("incident_notes")
    op.drop_table("incidents")
    postgresql.ENUM(name="incidentseverity").drop(op.get_bind())
    postgresql.ENUM(name="incidentstatus").drop(op.get_bind())

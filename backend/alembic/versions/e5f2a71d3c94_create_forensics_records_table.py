"""create forensics_records table

Revision ID: e5f2a71d3c94
Revises: d4e8b25c9a16
Create Date: 2026-07-16 18:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e5f2a71d3c94"
down_revision = "d4e8b25c9a16"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # NOTE: no new ENUM type created here - threat_verdict reuses the
    # 'verdict' Postgres enum type that migration d4e8b25c9a16 already
    # created for threat_lookups.verdict. Creating it again would error
    # with "type already exists", so we reference it with create_type=False.
    op.create_table(
        "forensics_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(512), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(255), nullable=False),
        sa.Column("md5_hash", sa.String(32), nullable=False),
        sa.Column("sha1_hash", sa.String(40), nullable=False),
        sa.Column("sha256_hash", sa.String(64), nullable=False),
        sa.Column("has_gps_data", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("metadata_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column(
            "threat_verdict",
            postgresql.ENUM("malicious", "suspicious", "clean", "unknown", name="verdict", create_type=False),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_forensics_records_user_id", "forensics_records", ["user_id"])
    op.create_index("ix_forensics_records_md5_hash", "forensics_records", ["md5_hash"])
    op.create_index("ix_forensics_records_sha1_hash", "forensics_records", ["sha1_hash"])
    op.create_index("ix_forensics_records_sha256_hash", "forensics_records", ["sha256_hash"])
    op.create_index("ix_forensics_records_created_at", "forensics_records", ["created_at"])


def downgrade() -> None:
    op.drop_table("forensics_records")

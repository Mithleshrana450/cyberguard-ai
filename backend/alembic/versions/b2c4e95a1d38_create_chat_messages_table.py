"""create chat_messages table

Revision ID: b2c4e95a1d38
Revises: a1b9d43f6e28
Create Date: 2026-07-17 14:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b2c4e95a1d38"
down_revision = "a1b9d43f6e28"
branch_labels = None
depends_on = None


def upgrade() -> None:
    role_enum = postgresql.ENUM("user", "assistant", name="messagerole")
    role_enum.create(op.get_bind())

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM("user", "assistant", name="messagerole", create_type=False),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_chat_messages_user_id", "chat_messages", ["user_id"])
    op.create_index("ix_chat_messages_created_at", "chat_messages", ["created_at"])


def downgrade() -> None:
    op.drop_table("chat_messages")
    postgresql.ENUM(name="messagerole").drop(op.get_bind())

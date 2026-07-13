"""
Declarative base for all ORM models.

Every model in app/models/ will inherit from `Base`. Alembic (our migration
tool) also imports this to auto-detect schema changes when we run
`alembic revision --autogenerate` in later modules.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

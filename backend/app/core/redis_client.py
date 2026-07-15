"""
Redis client.

Why Redis for brute-force detection instead of just querying Postgres:
Counting "how many failed logins from this IP in the last 5 minutes" is a
query Postgres CAN do, but Redis is purpose-built for it - INCR is an
atomic, single-operation counter increment, and EXPIRE gives us automatic
cleanup (the counter just vanishes after the time window, no cron job or
cleanup query needed). This is the classic Redis use case: fast, ephemeral,
high-frequency counters that don't need to survive forever.

redis-py's connection pool handles concurrency internally, so a single
module-level client (rather than a per-request dependency like get_db) is
the normal pattern here - unlike Postgres sessions, Redis connections
don't need per-request isolation.
"""

import redis

from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis():
    """
    FastAPI dependency wrapper around the module-level client. Routes use
    Depends(get_redis) instead of importing redis_client directly, so
    tests can override this dependency with a fake in-memory client - the
    same pattern as get_db() being overridable for a test database.
    """
    return redis_client

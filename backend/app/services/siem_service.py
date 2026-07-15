"""
SIEM service: logs login attempts and detects brute-force patterns.

Design note on testability: `record_login_attempt` takes `redis_client` as
a PARAMETER rather than importing the module-level client directly. This
means tests can pass in a lightweight fake object (see tests/test_siem.py)
instead of needing a real Redis server running - the same dependency-
injection principle used throughout this project (compare to how `db` is
always passed in, never imported directly, in every service function).
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.security_event import AlertSeverity, AlertType, LoginEvent, SecurityAlert

FAILED_LOGIN_WINDOW_SECONDS = 300  # 5 minutes
FAILED_LOGIN_THRESHOLD = 5


def record_login_attempt(
    db: Session,
    redis_client,
    email_attempted: str,
    ip_address: str,
    success: bool,
    user_id=None,
) -> SecurityAlert | None:
    """
    Logs the attempt to Postgres (permanent record) and, on failure,
    increments a Redis counter for this IP (fast, ephemeral). Returns the
    newly created SecurityAlert if this attempt just pushed the IP over
    the brute-force threshold, otherwise None.
    """
    db.add(
        LoginEvent(
            user_id=user_id,
            email_attempted=email_attempted,
            ip_address=ip_address,
            success=success,
        )
    )
    db.commit()

    if success:
        # A successful login clears this IP's failed-attempt counter - a
        # legitimate user who mistyped their password a couple times
        # shouldn't stay flagged after they get in correctly.
        redis_client.delete(f"failed_login_ip:{ip_address}")
        return None

    key = f"failed_login_ip:{ip_address}"
    count = redis_client.incr(key)
    if count == 1:
        # Only set the expiry on the FIRST failure in a new window - calling
        # EXPIRE on every increment would keep resetting the window and the
        # counter would never naturally time out.
        redis_client.expire(key, FAILED_LOGIN_WINDOW_SECONDS)

    # Fire exactly once per window, at the moment the count crosses the
    # threshold - not on every subsequent failure, which would flood the
    # alerts table with duplicate alerts for the same ongoing attack.
    if count == FAILED_LOGIN_THRESHOLD:
        alert = SecurityAlert(
            alert_type=AlertType.BRUTE_FORCE_LOGIN,
            severity=AlertSeverity.CRITICAL,
            title=f"Possible brute-force attack from {ip_address}",
            description=(
                f"{FAILED_LOGIN_THRESHOLD} failed login attempts were detected from IP "
                f"{ip_address} within {FAILED_LOGIN_WINDOW_SECONDS // 60} minutes. Most "
                f"recent target: '{email_attempted}'."
            ),
            source_ip=ip_address,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    return None

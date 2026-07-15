"""
Dashboard schemas.

Why security_score, active_alerts, etc. are all zero/empty right now:
This module builds the DASHBOARD SHELL - the layout and data contract -
before any scanner, SIEM, or threat-intel module exists to feed it real
numbers. Returning honest zeros (not fake demo data) means the frontend
component we build today is the SAME component that displays real numbers
once Module 3+ start writing to the database - no rewrite needed later.
"""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    security_score: int  # 0-100, populated by future scanner/SIEM modules
    active_alerts: int
    critical_alerts: int
    total_scans_run: int
    recent_activity: list[dict]  # populated by audit logging in a later module

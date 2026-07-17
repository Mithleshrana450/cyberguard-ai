"""
Incident status state machine.

Why this is a pure function, not just "accept whatever status the client
sends": a real incident workflow shouldn't allow jumping straight from
OPEN to CLOSED without ever being investigated or resolved - that's how
real incidents get silently dropped without anyone actually looking at
them. Encoding the valid transitions explicitly (and testing them
thoroughly) prevents that, the same way Module 1's RBAC prevents a viewer
from doing admin actions - a business rule enforced in code, not just
suggested by a UI.
"""

from app.models.incident import IncidentStatus

_ALLOWED_TRANSITIONS: dict[IncidentStatus, set[IncidentStatus]] = {
    IncidentStatus.OPEN: {IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED},
    IncidentStatus.INVESTIGATING: {IncidentStatus.OPEN, IncidentStatus.RESOLVED},
    IncidentStatus.RESOLVED: {IncidentStatus.CLOSED, IncidentStatus.OPEN, IncidentStatus.INVESTIGATING},
    IncidentStatus.CLOSED: {IncidentStatus.OPEN},
}


def is_valid_transition(from_status: IncidentStatus, to_status: IncidentStatus) -> bool:
    if from_status == to_status:
        return True
    return to_status in _ALLOWED_TRANSITIONS.get(from_status, set())

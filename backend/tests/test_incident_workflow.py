from app.models.incident import IncidentStatus
from app.services.incident_workflow import is_valid_transition

OPEN = IncidentStatus.OPEN
INVESTIGATING = IncidentStatus.INVESTIGATING
RESOLVED = IncidentStatus.RESOLVED
CLOSED = IncidentStatus.CLOSED


def test_open_to_investigating_is_valid():
    assert is_valid_transition(OPEN, INVESTIGATING) is True


def test_open_to_resolved_is_valid():
    assert is_valid_transition(OPEN, RESOLVED) is True


def test_open_to_closed_directly_is_invalid():
    assert is_valid_transition(OPEN, CLOSED) is False


def test_investigating_to_resolved_is_valid():
    assert is_valid_transition(INVESTIGATING, RESOLVED) is True


def test_investigating_back_to_open_is_valid():
    assert is_valid_transition(INVESTIGATING, OPEN) is True


def test_investigating_to_closed_directly_is_invalid():
    assert is_valid_transition(INVESTIGATING, CLOSED) is False


def test_resolved_to_closed_is_valid():
    assert is_valid_transition(RESOLVED, CLOSED) is True


def test_resolved_can_reopen_to_investigating():
    assert is_valid_transition(RESOLVED, INVESTIGATING) is True


def test_resolved_can_reopen_to_open():
    assert is_valid_transition(RESOLVED, OPEN) is True


def test_closed_can_reopen_to_open():
    assert is_valid_transition(CLOSED, OPEN) is True


def test_closed_to_resolved_directly_is_invalid():
    assert is_valid_transition(CLOSED, RESOLVED) is False


def test_closed_to_investigating_directly_is_invalid():
    assert is_valid_transition(CLOSED, INVESTIGATING) is False


def test_same_status_is_always_a_valid_noop():
    for status in [OPEN, INVESTIGATING, RESOLVED, CLOSED]:
        assert is_valid_transition(status, status) is True

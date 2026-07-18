from app.services.pdf_report import generate_security_report_pdf

EMPTY_SUMMARY = {
    "average_security_score": None,
    "total_scans": 0,
    "total_alerts": 0,
    "unresolved_alerts": 0,
    "total_incidents": 0,
    "open_incidents": 0,
    "recent_scans": [],
    "recent_alerts": [],
    "recent_incidents": [],
}

POPULATED_SUMMARY = {
    "average_security_score": 72,
    "total_scans": 3,
    "total_alerts": 2,
    "unresolved_alerts": 1,
    "total_incidents": 1,
    "open_incidents": 1,
    "recent_scans": [
        {"target_url": "https://example.com", "status": "completed", "security_score": 72, "started_at": "2026-07-17T10:00:00"}
    ],
    "recent_alerts": [
        {"title": "Brute-force attempt", "severity": "critical", "source_ip": "1.2.3.4", "created_at": "2026-07-17T10:00:00"}
    ],
    "recent_incidents": [
        {"title": "Suspicious login", "status": "open", "severity": "high", "created_at": "2026-07-17T10:00:00"}
    ],
}


def test_generates_valid_pdf_bytes_with_empty_data():
    pdf_bytes = generate_security_report_pdf(EMPTY_SUMMARY, "student@example.com")
    assert pdf_bytes[:5] == b"%PDF-"
    assert len(pdf_bytes) > 100


def test_generates_valid_pdf_bytes_with_populated_data():
    pdf_bytes = generate_security_report_pdf(POPULATED_SUMMARY, "student@example.com")
    assert pdf_bytes[:5] == b"%PDF-"
    assert len(pdf_bytes) > 100


def test_pdf_with_data_is_larger_than_empty_pdf():
    empty_pdf = generate_security_report_pdf(EMPTY_SUMMARY, "a@example.com")
    populated_pdf = generate_security_report_pdf(POPULATED_SUMMARY, "a@example.com")
    assert len(populated_pdf) > len(empty_pdf)


def test_handles_long_field_values_without_crashing():
    summary = dict(EMPTY_SUMMARY)
    summary["recent_scans"] = [
        {
            "target_url": "https://" + "a" * 200 + ".com",
            "status": "completed",
            "security_score": 50,
            "started_at": "2026-07-17T10:00:00",
        }
    ]
    pdf_bytes = generate_security_report_pdf(summary, "a@example.com")
    assert pdf_bytes[:5] == b"%PDF-"

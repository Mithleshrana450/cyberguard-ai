from app.services.assistant_context import build_context_summary


def test_summary_handles_no_scans_run():
    summary = build_context_summary({})
    assert "No website scans have been run yet" in summary


def test_summary_includes_scan_score_when_present():
    summary = build_context_summary({"latest_scan_score": 62, "latest_scan_target": "https://example.com"})
    assert "62/100" in summary
    assert "https://example.com" in summary


def test_summary_includes_all_zero_counts_by_default():
    summary = build_context_summary({})
    assert "Open critical scan findings: 0" in summary
    assert "Unresolved SIEM security alerts: 0" in summary
    assert "Threat-intel lookups flagged malicious: 0" in summary
    assert "Phishing checks flagged high/critical risk: 0" in summary


def test_summary_reflects_real_counts():
    summary = build_context_summary(
        {
            "critical_scan_findings": 3,
            "active_siem_alerts": 2,
            "malicious_threat_lookups": 1,
            "risky_phishing_checks": 5,
        }
    )
    assert "Open critical scan findings: 3" in summary
    assert "Unresolved SIEM security alerts: 2" in summary
    assert "Threat-intel lookups flagged malicious: 1" in summary
    assert "Phishing checks flagged high/critical risk: 5" in summary


def test_summary_omits_network_scan_line_when_none_run():
    summary = build_context_summary({})
    assert "network scan" not in summary.lower()


def test_summary_includes_network_scan_when_present():
    summary = build_context_summary(
        {"last_network_scan_hosts_up": 4, "last_network_scan_range": "172.18.0.0/28"}
    )
    assert "4 host(s)" in summary
    assert "172.18.0.0/28" in summary

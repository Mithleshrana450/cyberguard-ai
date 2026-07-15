from app.models.threat_intel import Verdict
from app.services.threat_intel_analysis import interpret_analysis_stats, unknown_result, url_to_vt_id


def test_interpret_stats_malicious_when_any_vendor_flags_malicious():
    stats = {"malicious": 3, "suspicious": 1, "harmless": 60, "undetected": 6, "timeout": 0}
    result = interpret_analysis_stats(stats)
    assert result.verdict == Verdict.MALICIOUS
    assert result.malicious_count == 3
    assert result.total_engines == 70


def test_interpret_stats_suspicious_when_no_malicious_but_some_suspicious():
    stats = {"malicious": 0, "suspicious": 2, "harmless": 65, "undetected": 3, "timeout": 0}
    result = interpret_analysis_stats(stats)
    assert result.verdict == Verdict.SUSPICIOUS
    assert result.suspicious_count == 2


def test_interpret_stats_clean_when_nothing_flagged():
    stats = {"malicious": 0, "suspicious": 0, "harmless": 68, "undetected": 2, "timeout": 0}
    result = interpret_analysis_stats(stats)
    assert result.verdict == Verdict.CLEAN


def test_interpret_stats_handles_missing_keys():
    # A real API response might omit a key entirely rather than send 0 -
    # the function should not crash on that.
    result = interpret_analysis_stats({})
    assert result.verdict == Verdict.CLEAN
    assert result.total_engines == 0


def test_unknown_result_is_distinct_from_clean():
    result = unknown_result()
    assert result.verdict == Verdict.UNKNOWN
    assert result.total_engines == 0


def test_url_to_vt_id_strips_padding():
    vt_id = url_to_vt_id("https://example.com")
    assert "=" not in vt_id
    # base64url alphabet only - no '+' or '/' characters
    assert "+" not in vt_id and "/" not in vt_id


def test_url_to_vt_id_is_deterministic():
    assert url_to_vt_id("https://example.com") == url_to_vt_id("https://example.com")

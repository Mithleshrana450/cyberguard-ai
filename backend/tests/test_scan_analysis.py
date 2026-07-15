from app.models.scan import FindingSeverity
from app.services.scan_analysis import analyze_headers, analyze_robots_txt, compute_security_score


def test_analyze_headers_flags_http_as_critical():
    findings = analyze_headers({}, "http://example.com")
    titles = [f.title for f in findings]
    assert "Site is not served over HTTPS" in titles


def test_analyze_headers_all_present_yields_no_header_findings():
    complete_headers = {
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=()",
    }
    findings = analyze_headers(complete_headers, "https://example.com")
    header_findings = [f for f in findings if f.category.value == "headers"]
    assert header_findings == []


def test_analyze_headers_is_case_insensitive():
    # HTTP headers are case-insensitive - "content-security-policy" and
    # "Content-Security-Policy" must be treated as the same header.
    headers = {"content-security-policy": "default-src 'self'"}
    findings = analyze_headers(headers, "https://example.com")
    titles = [f.title for f in findings]
    assert "Missing Content-Security-Policy header" not in titles


def test_analyze_headers_flags_missing_hsts_only_on_https():
    findings_https = analyze_headers({}, "https://example.com")
    findings_http = analyze_headers({}, "http://example.com")

    https_titles = [f.title for f in findings_https]
    http_titles = [f.title for f in findings_http]

    assert "Missing Strict-Transport-Security header" in https_titles
    # On plain HTTP, the "not HTTPS" finding already covers this - we
    # shouldn't double-flag HSTS on a site that isn't even using TLS.
    assert "Missing Strict-Transport-Security header" not in http_titles


def test_analyze_headers_flags_version_disclosure():
    findings = analyze_headers({"Server": "nginx/1.18.0"}, "https://example.com")
    titles = [f.title for f in findings]
    assert "Server header discloses software version" in titles


def test_analyze_headers_does_not_flag_generic_server_header():
    findings = analyze_headers({"Server": "nginx"}, "https://example.com")
    titles = [f.title for f in findings]
    assert "Server header discloses software version" not in titles


def test_analyze_robots_txt_flags_sensitive_paths():
    content = "User-agent: *\nDisallow: /admin\nDisallow: /public\n"
    findings = analyze_robots_txt(content, 200)
    assert len(findings) == 1
    assert "admin" in findings[0].description


def test_analyze_robots_txt_ignores_non_sensitive_paths():
    content = "User-agent: *\nDisallow: /blog\nDisallow: /images\n"
    findings = analyze_robots_txt(content, 200)
    assert findings == []


def test_analyze_robots_txt_handles_missing_file():
    findings = analyze_robots_txt(None, 404)
    assert findings == []


def test_compute_security_score_perfect_when_no_findings():
    assert compute_security_score([]) == 100


def test_compute_security_score_floors_at_zero():
    from app.services.scan_analysis import Finding
    from app.models.scan import FindingCategory

    many_critical = [
        Finding(FindingCategory.TLS, FindingSeverity.CRITICAL, "x", "y", "z") for _ in range(10)
    ]
    assert compute_security_score(many_critical) == 0

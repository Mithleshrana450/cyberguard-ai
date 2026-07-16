from app.services.phishing_analysis import (
    analyze_email,
    analyze_url,
    compute_risk_score,
    risk_level_from_score,
)


def test_analyze_url_flags_ip_address():
    findings = analyze_url("http://192.168.1.50/login")
    titles = [f.title for f in findings]
    assert "URL uses a raw IP address instead of a domain" in titles


def test_analyze_url_flags_at_symbol_trick():
    findings = analyze_url("http://paypal.com@evil-attacker.com/login")
    titles = [f.title for f in findings]
    assert "URL contains an '@' symbol trick" in titles


def test_analyze_url_flags_known_shortener():
    findings = analyze_url("http://bit.ly/3xample")
    titles = [f.title for f in findings]
    assert "URL uses a link-shortening service" in titles


def test_analyze_url_flags_punycode():
    findings = analyze_url("http://xn--pple-43d.com/verify")
    titles = [f.title for f in findings]
    assert any("Punycode" in t for t in titles)


def test_analyze_url_flags_typosquat_of_known_brand():
    findings = analyze_url("http://paypa1.com/secure-login")
    titles = [f.title for f in findings]
    assert "Domain closely resembles a well-known brand" in titles


def test_analyze_url_does_not_flag_legitimate_brand_domain():
    findings = analyze_url("https://paypal.com/signin")
    titles = [f.title for f in findings]
    assert "Domain closely resembles a well-known brand" not in titles


def test_analyze_url_clean_url_has_no_findings():
    findings = analyze_url("https://example.com/about-us")
    assert findings == []


def test_analyze_url_flags_excessive_subdomains():
    findings = analyze_url("http://secure.login.account.verify.example.com/page")
    titles = [f.title for f in findings]
    assert "URL has an unusually high number of subdomains" in titles


def test_analyze_email_flags_reply_to_mismatch():
    raw_email = (
        "From: Support <support@realbank.com>\n"
        "Reply-To: attacker@totally-different.com\n"
        "Subject: Account Notice\n\n"
        "Please review your account."
    )
    findings, _ = analyze_email(raw_email)
    titles = [f.title for f in findings]
    assert "Reply-To domain does not match From domain" in titles


def test_analyze_email_no_flag_when_reply_to_matches():
    raw_email = (
        "From: Support <support@realbank.com>\n"
        "Reply-To: help@realbank.com\n"
        "Subject: Account Notice\n\n"
        "Please review your account."
    )
    findings, _ = analyze_email(raw_email)
    titles = [f.title for f in findings]
    assert "Reply-To domain does not match From domain" not in titles


def test_analyze_email_flags_urgency_language():
    raw_email = (
        "From: security@example.com\n"
        "Subject: Urgent\n\n"
        "Your account will be closed. Verify your account immediately to avoid suspension."
    )
    findings, _ = analyze_email(raw_email)
    titles = [f.title for f in findings]
    assert "Body contains urgency/pressure language" in titles


def test_analyze_email_extracts_urls_from_body():
    raw_email = (
        "From: a@example.com\nSubject: Hi\n\n"
        "Please visit http://192.168.1.1/confirm to continue."
    )
    _, urls = analyze_email(raw_email)
    assert "http://192.168.1.1/confirm" in urls


def test_compute_risk_score_empty_findings_is_zero():
    assert compute_risk_score([]) == 0


def test_compute_risk_score_caps_at_100():
    from app.services.phishing_analysis import Finding

    many_critical = [Finding("critical", "x", "y") for _ in range(10)]
    assert compute_risk_score(many_critical) == 100


def test_risk_level_thresholds():
    assert risk_level_from_score(0) == "low"
    assert risk_level_from_score(20) == "medium"
    assert risk_level_from_score(45) == "high"
    assert risk_level_from_score(80) == "critical"

"""
Pure analysis functions for the scanner.

Why these are separated from the network-fetching code (in scanner_service.py):
A function like `analyze_headers(headers: dict) -> list[Finding]` takes
plain data in and returns plain data out - no HTTP calls, no randomness,
no side effects. That makes it trivially unit-testable: we can hand it a
fake headers dict and assert exactly which findings come out, without
needing a real website to scan against. This is the same "thin routes,
fat testable services" principle from Module 1, applied one layer deeper.
"""

from dataclasses import dataclass
from urllib.parse import urlparse

from app.models.scan import FindingCategory, FindingSeverity


@dataclass
class Finding:
    category: FindingCategory
    severity: FindingSeverity
    title: str
    description: str
    recommendation: str


# Each entry: (header name, severity if missing, description, recommendation)
SECURITY_HEADERS = [
    (
        "Strict-Transport-Security",
        FindingSeverity.HIGH,
        "HSTS tells browsers to always use HTTPS for this site, even if a user "
        "types 'http://' or clicks an old http link. Without it, the first "
        "request to a site can be silently downgraded to plain HTTP.",
        "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' "
        "to your server's response headers.",
    ),
    (
        "Content-Security-Policy",
        FindingSeverity.MEDIUM,
        "CSP restricts which sources of scripts, styles, and other resources "
        "the browser is allowed to load, reducing the impact of injected "
        "malicious scripts (XSS).",
        "Define a Content-Security-Policy header scoped to the domains your "
        "site actually needs (scripts, styles, images, fonts).",
    ),
    (
        "X-Frame-Options",
        FindingSeverity.MEDIUM,
        "Without this header, your site can be loaded inside an invisible "
        "iframe on an attacker's page, tricking users into clicking things "
        "they can't see (clickjacking).",
        "Add 'X-Frame-Options: DENY' or 'SAMEORIGIN', or use a CSP "
        "frame-ancestors directive.",
    ),
    (
        "X-Content-Type-Options",
        FindingSeverity.LOW,
        "Without 'nosniff', some browsers try to guess a file's type instead "
        "of trusting the declared Content-Type, which has historically "
        "enabled certain XSS techniques.",
        "Add 'X-Content-Type-Options: nosniff'.",
    ),
    (
        "Referrer-Policy",
        FindingSeverity.LOW,
        "Without this header, the full URL of the current page (which may "
        "contain sensitive query parameters) can leak to third-party sites "
        "via the Referer header when users click outbound links.",
        "Add 'Referrer-Policy: strict-origin-when-cross-origin' or stricter.",
    ),
    (
        "Permissions-Policy",
        FindingSeverity.INFO,
        "This header lets a site explicitly disable browser features it "
        "doesn't use (camera, microphone, geolocation), reducing what an "
        "attacker could abuse via injected scripts.",
        "Add a Permissions-Policy header disabling features you don't use, "
        "e.g. 'Permissions-Policy: camera=(), microphone=(), geolocation=()'.",
    ),
]


def analyze_headers(headers: dict[str, str], target_url: str) -> list[Finding]:
    # Normalize header names to a case-insensitive lookup, since HTTP
    # headers are case-insensitive but Python dicts are not by default.
    normalized = {k.lower(): v for k, v in headers.items()}
    findings: list[Finding] = []

    parsed = urlparse(target_url)
    is_https = parsed.scheme == "https"

    if not is_https:
        findings.append(
            Finding(
                category=FindingCategory.TLS,
                severity=FindingSeverity.CRITICAL,
                title="Site is not served over HTTPS",
                description="This site was reached over plain HTTP. All traffic, "
                "including any login credentials or form data, is visible to "
                "anyone on the network path between the user and this server.",
                recommendation="Obtain a TLS certificate (e.g. via Let's Encrypt, "
                "free) and redirect all HTTP traffic to HTTPS.",
            )
        )

    for header_name, severity, description, recommendation in SECURITY_HEADERS:
        # HSTS only makes sense to check on HTTPS sites - flagging it on an
        # HTTP-only site would be redundant with the finding above.
        if header_name == "Strict-Transport-Security" and not is_https:
            continue
        if header_name.lower() not in normalized:
            findings.append(
                Finding(
                    category=FindingCategory.HEADERS,
                    severity=severity,
                    title=f"Missing {header_name} header",
                    description=description,
                    recommendation=recommendation,
                )
            )

    server_header = normalized.get("server", "")
    if any(char.isdigit() for char in server_header):
        findings.append(
            Finding(
                category=FindingCategory.DISCLOSURE,
                severity=FindingSeverity.LOW,
                title="Server header discloses software version",
                description=f"The Server header reveals: '{server_header}'. "
                "Attackers can use this to look up known vulnerabilities for "
                "this exact software version.",
                recommendation="Configure your web server to omit or generalize "
                "the Server header (e.g. 'server_tokens off;' in nginx).",
            )
        )

    if "x-powered-by" in normalized:
        findings.append(
            Finding(
                category=FindingCategory.DISCLOSURE,
                severity=FindingSeverity.INFO,
                title="X-Powered-By header discloses backend technology",
                description=f"The X-Powered-By header reveals: '{normalized['x-powered-by']}'.",
                recommendation="Disable this header at the framework/server level.",
            )
        )

    return findings


def analyze_robots_txt(content: str | None, status_code: int) -> list[Finding]:
    findings: list[Finding] = []

    if status_code != 200 or content is None:
        # Not having a robots.txt is not itself a security issue - it's
        # informational only, so INFO severity, not a real deduction driver.
        return findings

    disallowed_paths = [
        line.split(":", 1)[1].strip()
        for line in content.splitlines()
        if line.lower().startswith("disallow:") and line.split(":", 1)[1].strip()
    ]

    if disallowed_paths:
        sensitive_keywords = ("admin", "login", "backup", "config", "wp-admin", "internal", ".env")
        sensitive_hits = [p for p in disallowed_paths if any(k in p.lower() for k in sensitive_keywords)]
        if sensitive_hits:
            findings.append(
                Finding(
                    category=FindingCategory.ROBOTS,
                    severity=FindingSeverity.INFO,
                    title="robots.txt discloses potentially sensitive paths",
                    description="robots.txt is meant to guide search engine crawlers, but it "
                    "is publicly readable by anyone - including attackers. It lists paths "
                    f"like: {', '.join(sensitive_hits[:5])}, which may hint at admin panels "
                    "or internal tooling that would otherwise be harder to find.",
                    recommendation="Don't rely on robots.txt to hide sensitive paths - use "
                    "proper authentication instead. Consider removing obviously sensitive "
                    "path names from robots.txt.",
                )
            )

    return findings


def compute_security_score(findings: list[Finding]) -> int:
    """
    Starts at 100, deducts points per finding based on severity. Floors at 0
    rather than going negative - a negative score isn't more meaningful to
    a user than 0, it's just confusing.
    """
    deductions = {
        FindingSeverity.CRITICAL: 30,
        FindingSeverity.HIGH: 15,
        FindingSeverity.MEDIUM: 8,
        FindingSeverity.LOW: 3,
        FindingSeverity.INFO: 0,
    }
    score = 100
    for finding in findings:
        score -= deductions[finding.severity]
    return max(0, score)

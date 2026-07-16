"""
Pure phishing heuristic functions - same pattern as scan_analysis.py
(Module 3): take plain data in, return plain data out, no network calls.
This is what makes it possible to unit test "does this correctly flag an
IP-address URL as suspicious" without ever making an HTTP request.
"""

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from email import message_from_string
from email.message import Message
from urllib.parse import urlparse

# A small set of frequently-impersonated brands, used only for a coarse
# typosquatting check (not exhaustive - a real product would use a much
# larger, maintained list, but this demonstrates the technique clearly).
COMMONLY_SPOOFED_DOMAINS = [
    "paypal.com", "google.com", "microsoft.com", "apple.com", "amazon.com",
    "facebook.com", "bankofamerica.com", "chase.com", "netflix.com", "dropbox.com",
]

KNOWN_URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly",
}

URGENCY_PHRASES = [
    "verify your account", "account suspended", "act now", "click here immediately",
    "confirm your identity", "unusual activity", "your account will be closed",
    "urgent action required", "limited time", "verify immediately",
]

URL_REGEX = re.compile(r"https?://[^\s<>\"']+")


@dataclass
class Finding:
    severity: str  # "critical" | "high" | "medium" | "low"
    title: str
    description: str


def _is_ip_address(host: str) -> bool:
    return bool(re.fullmatch(r"(\d{1,3}\.){3}\d{1,3}", host or ""))


def _closest_spoofed_domain(domain: str) -> tuple[str, float] | None:
    """
    Returns (brand_domain, similarity_ratio) for the closest match above a
    suspicious-but-not-identical threshold - close enough to fool a skim
    read, but not an exact match (an exact match isn't spoofing).
    """
    best_match, best_ratio = None, 0.0
    for brand in COMMONLY_SPOOFED_DOMAINS:
        if domain == brand:
            continue  # exact match to a real brand domain - not spoofing
        ratio = SequenceMatcher(None, domain, brand).ratio()
        if ratio > best_ratio:
            best_match, best_ratio = brand, ratio
    if best_match and best_ratio >= 0.85:
        return best_match, best_ratio
    return None


def analyze_url(url: str) -> list[Finding]:
    findings: list[Finding] = []
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()

    if _is_ip_address(host):
        findings.append(
            Finding(
                "high",
                "URL uses a raw IP address instead of a domain",
                f"The link points directly to an IP address ({host}) rather than a domain name. "
                "Legitimate sites almost never do this - it's a common way to avoid domain-based "
                "reputation blocklists.",
            )
        )

    if "@" in url.split("://", 1)[-1]:
        findings.append(
            Finding(
                "critical",
                "URL contains an '@' symbol trick",
                "Everything before an '@' in a URL is ignored by the browser for navigation "
                "purposes - this can make a link visually appear to go to a trusted site while "
                "actually navigating somewhere else entirely.",
            )
        )

    if host in KNOWN_URL_SHORTENERS:
        findings.append(
            Finding(
                "medium",
                "URL uses a link-shortening service",
                f"'{host}' is a URL shortener - the real destination is hidden until the link "
                "is clicked, a common tactic to bypass a quick visual check of where a link leads.",
            )
        )

    if host.startswith("xn--") or ".xn--" in host:
        findings.append(
            Finding(
                "high",
                "URL uses Punycode (possible homograph attack)",
                "This domain uses Punycode encoding, which can be used to register domains that "
                "visually resemble a trusted domain using look-alike characters from other alphabets.",
            )
        )

    domain_parts = host.split(".")
    registrable_domain = ".".join(domain_parts[-2:]) if len(domain_parts) >= 2 else host
    spoofed = _closest_spoofed_domain(registrable_domain)
    if spoofed:
        brand, ratio = spoofed
        findings.append(
            Finding(
                "critical",
                "Domain closely resembles a well-known brand",
                f"'{registrable_domain}' is suspiciously similar to '{brand}' "
                f"({ratio:.0%} similarity) but is not the real domain - a classic typosquatting pattern.",
            )
        )

    if len(domain_parts) > 4:
        findings.append(
            Finding(
                "low",
                "URL has an unusually high number of subdomains",
                f"'{host}' has {len(domain_parts)} domain segments - excessive subdomains are "
                "sometimes used to bury the real destination or exploit lazy URL-preview parsing.",
            )
        )

    return findings


def analyze_email(raw_email: str) -> tuple[list[Finding], list[str]]:
    """
    Returns (findings, urls_found_in_body). The caller runs analyze_url()
    on each extracted URL separately - keeping URL logic in ONE place
    rather than duplicating it here.
    """
    findings: list[Finding] = []
    msg: Message = message_from_string(raw_email)

    from_header = msg.get("From", "")
    reply_to_header = msg.get("Reply-To", "")

    from_domain = from_header.split("@")[-1].strip(">").lower() if "@" in from_header else ""
    reply_to_domain = reply_to_header.split("@")[-1].strip(">").lower() if "@" in reply_to_header else ""

    if reply_to_domain and from_domain and reply_to_domain != from_domain:
        findings.append(
            Finding(
                "high",
                "Reply-To domain does not match From domain",
                f"The visible sender domain ('{from_domain}') differs from where replies actually "
                f"go ('{reply_to_domain}') - a common technique to receive responses to a "
                "spoofed sender identity.",
            )
        )

    body = msg.get_payload() if not msg.is_multipart() else str(msg.get_payload(0))
    body_lower = (body or "").lower()

    matched_phrases = [p for p in URGENCY_PHRASES if p in body_lower]
    if matched_phrases:
        findings.append(
            Finding(
                "medium",
                "Body contains urgency/pressure language",
                "Phrases designed to provoke quick, unconsidered action were found: "
                + ", ".join(f"'{p}'" for p in matched_phrases[:3])
                + ". Legitimate organizations rarely demand immediate action via email.",
            )
        )

    urls_found = URL_REGEX.findall(body or "")
    return findings, urls_found


def compute_risk_score(findings: list[Finding]) -> int:
    weights = {"critical": 40, "high": 25, "medium": 12, "low": 5}
    score = sum(weights.get(f.severity, 0) for f in findings)
    return min(100, score)


def risk_level_from_score(score: int) -> str:
    if score >= 70:
        return "critical"
    if score >= 40:
        return "high"
    if score >= 15:
        return "medium"
    return "low"

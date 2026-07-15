"""
Pure VirusTotal response interpretation - no network calls, fully unit
testable, following the same pattern as scan_analysis.py in Module 3.

VirusTotal's API returns, for any IP/domain/URL/hash it has data on:
    data.attributes.last_analysis_stats = {
        "malicious": int, "suspicious": int, "harmless": int,
        "undetected": int, "timeout": int
    }
That's the count of security vendors (out of ~70+) that flagged the
target each way. We turn that into our own three-tier verdict.
"""

import base64
from dataclasses import dataclass

from app.models.threat_intel import Verdict


@dataclass
class LookupResult:
    verdict: Verdict
    malicious_count: int
    suspicious_count: int
    total_engines: int
    summary: str


def url_to_vt_id(url: str) -> str:
    """
    VirusTotal identifies URLs by the base64url encoding of the URL
    itself, with trailing '=' padding stripped. This is documented VT API
    behavior, not something we invented - see VT API v3 docs for /urls/{id}.
    """
    return base64.urlsafe_b64encode(url.encode()).decode().strip("=")


def interpret_analysis_stats(stats: dict) -> LookupResult:
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    harmless = stats.get("harmless", 0)
    undetected = stats.get("undetected", 0)
    timeout = stats.get("timeout", 0)
    total = malicious + suspicious + harmless + undetected + timeout

    if malicious > 0:
        verdict = Verdict.MALICIOUS
        summary = f"{malicious} of {total} security vendors flagged this as malicious."
    elif suspicious > 0:
        verdict = Verdict.SUSPICIOUS
        summary = f"{suspicious} of {total} security vendors flagged this as suspicious."
    else:
        verdict = Verdict.CLEAN
        summary = f"No vendors flagged this as malicious, out of {total} that analyzed it."

    return LookupResult(
        verdict=verdict,
        malicious_count=malicious,
        suspicious_count=suspicious,
        total_engines=total,
        summary=summary,
    )


def unknown_result() -> LookupResult:
    """Used when VirusTotal has no record at all for this target (404) -
    genuinely different from 'clean', since it means no vendor has ever
    analyzed it, not that they analyzed it and found nothing."""
    return LookupResult(
        verdict=Verdict.UNKNOWN,
        malicious_count=0,
        suspicious_count=0,
        total_engines=0,
        summary="Not previously analyzed by VirusTotal - no data available.",
    )

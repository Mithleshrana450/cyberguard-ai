"""
Threat intelligence orchestration service.

Redis caching strategy: results are cached for 1 hour, keyed by lookup
type + value. This matters for two reasons:
  1. VirusTotal's free tier allows only 4 requests/minute - a user
     re-checking the same IP a few times (or refreshing a page) would
     otherwise burn through that quota fast.
  2. Threat intel data doesn't change second-to-second - an hour-old
     verdict on whether an IP is known-malicious is still useful.
"""

import json

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.threat_intel import LookupType, ThreatLookup
from app.services import threat_intel_analysis as tia

VT_BASE_URL = "https://www.virustotal.com/api/v3"
CACHE_TTL_SECONDS = 3600
REQUEST_TIMEOUT = 10


def _vt_lookup(lookup_type: LookupType, value: str) -> tia.LookupResult:
    if not settings.VIRUSTOTAL_API_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Threat intelligence is not configured. An administrator needs to set "
            "VIRUSTOTAL_API_KEY in the environment (see docs/api/module5-threat-intel.md).",
        )

    endpoint_map = {
        LookupType.IP: f"{VT_BASE_URL}/ip_addresses/{value}",
        LookupType.DOMAIN: f"{VT_BASE_URL}/domains/{value}",
        LookupType.URL: f"{VT_BASE_URL}/urls/{tia.url_to_vt_id(value)}",
        LookupType.HASH: f"{VT_BASE_URL}/files/{value}",
    }

    response = requests.get(
        endpoint_map[lookup_type],
        headers={"x-apikey": settings.VIRUSTOTAL_API_KEY},
        timeout=REQUEST_TIMEOUT,
    )

    if response.status_code == 404:
        return tia.unknown_result()

    if response.status_code == 401:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "VirusTotal rejected the configured API key.")

    if response.status_code == 429:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "VirusTotal rate limit reached (free tier: 4 requests/minute). Try again shortly.",
        )

    response.raise_for_status()
    stats = response.json()["data"]["attributes"]["last_analysis_stats"]
    return tia.interpret_analysis_stats(stats)


def run_lookup(db: Session, redis_client, user_id, lookup_type: LookupType, value: str) -> ThreatLookup:
    cache_key = f"threat_intel:{lookup_type.value}:{value}"
    cached = redis_client.get(cache_key)

    if cached:
        cached_data = json.loads(cached)
        result = tia.LookupResult(
            verdict=tia.Verdict(cached_data["verdict"]),
            malicious_count=cached_data["malicious_count"],
            suspicious_count=cached_data["suspicious_count"],
            total_engines=cached_data["total_engines"],
            summary=cached_data["summary"],
        )
    else:
        try:
            result = _vt_lookup(lookup_type, value)
        except requests.RequestException as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Could not reach VirusTotal: {exc}")

        redis_client.setex(
            cache_key,
            CACHE_TTL_SECONDS,
            json.dumps(
                {
                    "verdict": result.verdict.value,
                    "malicious_count": result.malicious_count,
                    "suspicious_count": result.suspicious_count,
                    "total_engines": result.total_engines,
                    "summary": result.summary,
                }
            ),
        )

    lookup = ThreatLookup(
        user_id=user_id,
        lookup_type=lookup_type,
        query_value=value,
        verdict=result.verdict,
        malicious_count=result.malicious_count,
        suspicious_count=result.suspicious_count,
        total_engines=result.total_engines,
        summary=result.summary,
    )
    db.add(lookup)
    db.commit()
    db.refresh(lookup)
    return lookup

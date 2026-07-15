"""
Scanner orchestration service.

This is the "glue" layer: it calls the network-fetching code, hands the
raw results to the pure analysis functions in scan_analysis.py and
tls_check.py, and persists everything to the database. Kept separate from
those analysis functions specifically so THIS function can stay untested-
by-unit-tests (it needs a real or heavily mocked network) while the actual
security LOGIC underneath it is fully unit tested.
"""

from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
from sqlalchemy.orm import Session

from app.models.scan import Scan, ScanFinding, ScanStatus
from app.services import scan_analysis
from app.services.tls_check import check_tls_certificate

REQUEST_TIMEOUT = 8  # seconds - a scan that hangs forever is a worse UX than one that fails fast
USER_AGENT = "CyberGuard-AI-Scanner/1.0 (+educational security scanner)"


def _validate_target_url(target_url: str) -> str:
    parsed = urlparse(target_url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("URL must start with http:// or https://")
    if not parsed.netloc:
        raise ValueError("URL must include a valid host, e.g. https://example.com")
    return target_url


def run_scan(db: Session, user_id, target_url: str) -> Scan:
    target_url = _validate_target_url(target_url)
    parsed = urlparse(target_url)

    scan = Scan(user_id=user_id, target_url=target_url, status=ScanStatus.RUNNING)
    db.add(scan)
    db.commit()
    db.refresh(scan)

    all_findings: list[scan_analysis.Finding] = []

    try:
        response = requests.get(
            target_url,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": USER_AGENT},
            allow_redirects=True,
        )
        all_findings.extend(scan_analysis.analyze_headers(dict(response.headers), target_url))

        if parsed.scheme == "https":
            all_findings.extend(check_tls_certificate(parsed.hostname))

        try:
            robots_response = requests.get(
                f"{parsed.scheme}://{parsed.netloc}/robots.txt",
                timeout=REQUEST_TIMEOUT,
                headers={"User-Agent": USER_AGENT},
            )
            all_findings.extend(
                scan_analysis.analyze_robots_txt(robots_response.text, robots_response.status_code)
            )
        except requests.RequestException:
            # robots.txt is optional/informational - a failure to fetch it
            # shouldn't fail the whole scan.
            pass

        scan.security_score = scan_analysis.compute_security_score(all_findings)
        scan.status = ScanStatus.COMPLETED

        for f in all_findings:
            db.add(
                ScanFinding(
                    scan_id=scan.id,
                    category=f.category,
                    severity=f.severity,
                    title=f.title,
                    description=f.description,
                    recommendation=f.recommendation,
                )
            )

    except requests.RequestException as exc:
        scan.status = ScanStatus.FAILED
        scan.error_message = f"Could not reach target: {str(exc)[:500]}"

    scan.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(scan)
    return scan

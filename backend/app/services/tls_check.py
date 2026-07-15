"""
TLS certificate inspection.

This is kept separate from scan_analysis.py's pure functions because it
genuinely needs a live network connection (opening a TLS handshake to read
the server's certificate) - it can't be unit tested the same "pure
function in, pure data out" way. We still return plain Finding objects so
the CALLING code stays consistent.
"""

import socket
import ssl
from datetime import datetime, timezone

from app.models.scan import FindingCategory, FindingSeverity
from app.services.scan_analysis import Finding


def check_tls_certificate(hostname: str, port: int = 443, timeout: float = 5.0) -> list[Finding]:
    findings: list[Finding] = []

    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                protocol_version = ssock.version()
    except (socket.timeout, socket.gaierror, ConnectionRefusedError, ssl.SSLError, OSError):
        # We don't raise here - a TLS connection failure on a site that
        # otherwise responded over HTTP is itself informative, but the
        # header-based "not HTTPS" finding already covers the main risk.
        # A hard failure here shouldn't crash the entire scan.
        return findings

    # Certificate expiry check
    not_after_str = cert.get("notAfter")
    if not_after_str:
        expires_at = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z").replace(
            tzinfo=timezone.utc
        )
        days_remaining = (expires_at - datetime.now(timezone.utc)).days

        if days_remaining < 0:
            findings.append(
                Finding(
                    category=FindingCategory.TLS,
                    severity=FindingSeverity.CRITICAL,
                    title="TLS certificate has expired",
                    description=f"The certificate expired on {expires_at.date()}. Browsers "
                    "will show a security warning to every visitor.",
                    recommendation="Renew the TLS certificate immediately.",
                )
            )
        elif days_remaining < 14:
            findings.append(
                Finding(
                    category=FindingCategory.TLS,
                    severity=FindingSeverity.HIGH,
                    title="TLS certificate expires soon",
                    description=f"The certificate expires in {days_remaining} day(s), "
                    f"on {expires_at.date()}.",
                    recommendation="Renew the certificate now to avoid an outage. Consider "
                    "automated renewal (e.g. certbot) to prevent this in the future.",
                )
            )

    # Outdated protocol version check
    if protocol_version in ("TLSv1", "TLSv1.1"):
        findings.append(
            Finding(
                category=FindingCategory.TLS,
                severity=FindingSeverity.HIGH,
                title=f"Outdated TLS protocol in use: {protocol_version}",
                description=f"{protocol_version} has known weaknesses and is deprecated by "
                "all major browsers and the PCI Security Standards Council.",
                recommendation="Disable TLS 1.0/1.1 on the server and require TLS 1.2 or higher.",
            )
        )

    return findings

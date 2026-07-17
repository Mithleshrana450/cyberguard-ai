"""
Pure/testable network scanning logic.

The authorization check in this file is the single most important piece
of code in this module - see Module 8's explanation for why unauthorized
network scanning is a real legal and ethical line, not just a "best
practice" suggestion. This function is what actually enforces it, at the
API layer, before any socket is ever opened.
"""

import ipaddress
from dataclasses import dataclass

MAX_SCAN_PREFIX_LENGTH = 27  # /27 = 32 addresses max per scan - keeps a
# synchronous scan fast and prevents this from being repurposed as a
# bulk network scanner.

# A curated set of common ports, not an exhaustive 65535-port scan - this
# is a monitoring/awareness tool, not a penetration-testing port scanner.
COMMON_PORTS: dict[int, str] = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    445: "SMB",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    5900: "VNC",
    6379: "Redis",
    8000: "HTTP-Alt",
    8080: "HTTP-Alt",
    8443: "HTTPS-Alt",
}


@dataclass
class AuthorizationResult:
    is_authorized: bool
    network: ipaddress.IPv4Network | None
    error: str | None


def check_target_authorized(target_range: str) -> AuthorizationResult:
    """
    Validates a target BEFORE any scanning happens. Two independent checks:
      1. Must be a private/local range (ipaddress.is_private covers RFC1918
         private ranges plus loopback - anything NOT globally routable).
      2. Must not exceed MAX_SCAN_PREFIX_LENGTH addresses.

    A single IP (no /prefix) is treated as a /32 - one host.
    """
    try:
        network = ipaddress.ip_network(target_range, strict=False)
    except ValueError:
        return AuthorizationResult(False, None, f"'{target_range}' is not a valid IP address or CIDR range.")

    if not network.is_private:
        return AuthorizationResult(
            False,
            None,
            "Only private/local network ranges are allowed (10.0.0.0/8, 172.16.0.0/12, "
            "192.168.0.0/16, 127.0.0.0/8). Scanning public IP addresses without explicit "
            "authorization is illegal in most jurisdictions.",
        )

    if network.prefixlen < MAX_SCAN_PREFIX_LENGTH:
        return AuthorizationResult(
            False,
            None,
            f"Range too large - maximum {2 ** (32 - MAX_SCAN_PREFIX_LENGTH)} addresses per scan "
            f"(/{MAX_SCAN_PREFIX_LENGTH} or smaller). Requested range covers "
            f"{network.num_addresses} addresses.",
        )

    return AuthorizationResult(True, network, None)


def service_name_for_port(port: int) -> str:
    return COMMON_PORTS.get(port, "Unknown")

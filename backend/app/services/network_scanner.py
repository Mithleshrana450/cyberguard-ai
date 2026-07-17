"""
Network scanning orchestration - the part that opens real sockets.

Uses TCP connect scanning (socket.connect_ex), not raw ICMP ping. This is
deliberate: raw ICMP sockets need elevated privileges (CAP_NET_RAW) that
a container shouldn't be granted just to run this feature, whereas a TCP
connect attempt is a completely ordinary operation any process can do.
The tradeoff (documented in Module 8's docs) is that a host with zero
open ports among our checked list won't be detected as "up" - a known,
accepted limitation of TCP-only discovery vs ICMP.

ThreadPoolExecutor provides the concurrency - without it, scanning even a
/27 (32 hosts x ~18 ports each = 576 individual connection attempts)
sequentially would take minutes instead of seconds.
"""

import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

from app.services.network_analysis import COMMON_PORTS

CONNECT_TIMEOUT_SECONDS = 0.5
MAX_WORKERS = 50


@dataclass
class HostResult:
    ip_address: str
    is_up: bool
    open_ports: list[int] = field(default_factory=list)
    hostname: str | None = None


def _check_port(ip: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(CONNECT_TIMEOUT_SECONDS)
        return sock.connect_ex((ip, port)) == 0


def _resolve_hostname(ip: str) -> str | None:
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror, OSError):
        return None


def scan_host(ip: str) -> HostResult:
    open_ports = []
    with ThreadPoolExecutor(max_workers=len(COMMON_PORTS)) as executor:
        futures = {executor.submit(_check_port, ip, port): port for port in COMMON_PORTS}
        for future in as_completed(futures):
            port = futures[future]
            try:
                if future.result():
                    open_ports.append(port)
            except OSError:
                pass

    is_up = len(open_ports) > 0
    hostname = _resolve_hostname(ip) if is_up else None
    return HostResult(ip_address=ip, is_up=is_up, open_ports=sorted(open_ports), hostname=hostname)


def scan_network(hosts: list[str]) -> list[HostResult]:
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(scan_host, ip): ip for ip in hosts}
        for future in as_completed(futures):
            results.append(future.result())
    return sorted(results, key=lambda r: socket.inet_aton(r.ip_address))

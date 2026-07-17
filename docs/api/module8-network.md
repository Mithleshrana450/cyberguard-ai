# Module 8: Network Monitoring

## What was built
- TCP connect scanning across a private IP range - device discovery + open
  port detection, no raw sockets or elevated container privileges needed
- **Hard authorization boundary enforced server-side**: only private/local
  ranges accepted (RFC1918 + loopback), max `/27` (32 addresses) per scan
- Best-effort reverse DNS hostname resolution for hosts found "up"
- RBAC-restricted to `admin`/`analyst` (same reasoning as Module 4's SIEM)
- 23 new tests, including one specifically proving **even an admin account
  cannot bypass the private-range check**

## The most important test in this module

```python
def test_scan_rejects_public_ip_even_for_admin(client):
    admin_token = _get_admin_token(client)
    response = client.post("/api/v1/network/scan", json={"target_range": "8.8.8.8/32"}, ...)
    assert response.status_code == 403
```

RBAC controls *who* can use this feature. The authorization boundary
controls *what* the feature is allowed to do, regardless of who's asking.
Both matter, and they're deliberately separate checks - a compromised or
malicious admin account still can't turn this into a tool for scanning
arbitrary public infrastructure.

## A real architectural note: "local network" means the Docker network

The backend runs inside a container, so `socket.connect()` calls from
inside it reach the **Docker Compose network** (the `172.18.0.0/16`-ish
range), not your host machine's actual home Wi-Fi LAN. This is genuinely
useful as a safe default: the Docker network is guaranteed to be
something you own, so it's always a legitimate target to demo against.

If you wanted this to see your real home LAN, the backend service would
need `network_mode: host` in `docker-compose.yml` (Linux only) - but this
has a real, breaking side effect: host networking bypasses Docker's
internal DNS, so `DATABASE_URL=postgresql://...@db:5432/...` and
`REDIS_URL=redis://redis:6379` would stop resolving (`db`/`redis` are
Docker Compose service names, only resolvable on the Compose network).
Fixing that requires either hardcoding container IPs or restructuring
networking further. Deliberately not done in this module - the risk of
breaking the whole working app outweighs the benefit for a portfolio
demo, but it's documented here as the real path if you want to extend this.

## API Reference

### POST /api/v1/network/scan
**Requires `admin` or `analyst` role.**
**Request:** `{ "target_range": "172.18.0.0/28" }`
**Response `201`:** `hosts_scanned`, `hosts_up`, and a `hosts[]` array
each with `ip_address`, `is_up`, `hostname` (nullable), `open_ports_json`.

**Errors:** `403` if the range is public or exceeds the size cap (this
IS the authorization boundary, not a bug) - a role mismatch also returns
`403`.

### GET /api/v1/network/scans / GET /api/v1/network/scans/{id}
History, same RBAC restriction.

## Design decisions worth understanding

**TCP connect scanning, not ICMP ping.**
Raw ICMP sockets need `CAP_NET_RAW`, a Linux capability a container
shouldn't be granted just for this feature - it widens the container's
privilege footprint for one module's convenience. TCP `connect()` is a
completely ordinary socket operation available to any process. The
tradeoff: a host with zero open ports among our ~18 checked common ports
won't register as "up" - a known, accepted limitation of TCP-only
discovery, not an oversight.

**`ThreadPoolExecutor`, not `asyncio`.**
The rest of this codebase is synchronous (SQLAlchemy's ORM session isn't
async), so introducing `asyncio` just for the socket layer would mean
juggling two concurrency models in one request. Threads are the right
tool here: socket I/O releases the GIL during blocking calls, so a thread
pool gets real concurrency benefit without an async rewrite.

## Known tradeoffs
- Synchronous scanning (same pattern as Module 3's scanner) - the request
  blocks until the scan finishes. Capped at 32 hosts specifically to keep
  this fast; a background job queue (Celery + Redis, foreshadowed since
  Module 4) would be the right fix for larger ranges.
- No OS/service fingerprinting - we report "port 22 is open," not "this
  looks like OpenSSH 8.2." That level of detail requires actually reading
  service banners, a meaningfully larger scope.
- Scanning across NAT boundaries from inside a container isn't meaningful
  by design - see the architectural note above.

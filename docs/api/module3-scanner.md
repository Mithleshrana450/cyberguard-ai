# Module 3: Website Security Scanner

## What was built
- Passive security scanner checking: security headers, TLS certificate
  expiry/protocol version, robots.txt exposure, server version disclosure
- Score calculation (0-100) based on finding severity
- Full scan history per user
- Dashboard now shows real numbers (security score, alert counts, recent
  scans) instead of Module 2's honest placeholders
- 17 new tests: pure-function unit tests for the analysis logic (no
  network needed) + API tests with the network call mocked

## API Reference

### POST /api/v1/scanner/scans
Runs a new scan against a target URL. Requires authentication.

**Request body:** `{ "target_url": "https://example.com" }`

**Response `201 Created`:** full scan object including `findings[]`, each
finding with `category`, `severity`, `title`, `description`, `recommendation`.

**Errors:** `422` for a malformed URL (must start with `http://` or `https://`).

### GET /api/v1/scanner/scans
Lists the current user's past scans (lightweight - no findings array).

### GET /api/v1/scanner/scans/{scan_id}
Returns one scan with its full findings list. `404` if not found or not
owned by the current user.

## Design decisions worth understanding

**Pure functions vs. network code, kept in separate files.**
`scan_analysis.py` contains functions like `analyze_headers(headers, url) -> findings`
that take plain data in and return plain data out - no network calls. This
is what let us write 12 unit tests that run in milliseconds with zero
network dependency. `scanner_service.py` and `tls_check.py` hold the parts
that genuinely need a live connection, and are tested at the API level
with `requests.get` mocked out via `unittest.mock.patch`.

**Why mock the network in tests instead of scanning a real site:**
A test that depends on `example.com` staying up, staying fast, and never
changing its headers is a flaky test - it can fail for reasons that have
nothing to do with your code. Mocking `requests.get` makes the test
deterministic: it always returns exactly the headers we told it to,
so a failure always means an actual bug in the analysis logic.

**Synchronous scanning (no background job queue).**
The scan runs directly inside the request/response cycle - the user waits
a few seconds for `POST /scans` to return. This is fine for headers/TLS
checks (a few seconds), but would NOT scale to a heavier module (e.g. a
full port scan). If a future module needs long-running background work,
that's the point to introduce Celery + Redis (Redis is already in
docker-compose.yml from Module 0, unused until now).

## Known tradeoffs
- No rate limiting on scan creation yet - a user could spam scans against
  the same target. Planned for the Mini SIEM module alongside login
  brute-force detection.
- No scheduled/recurring scans - every scan is triggered manually. A
  "scan this site daily" feature would need the background job
  infrastructure mentioned above.
- TLS check failures are swallowed silently (return empty findings rather
  than raising) - this was a deliberate choice so a TLS handshake timeout
  doesn't fail the entire scan, but it does mean "no TLS findings" could
  mean either "TLS is fine" or "we couldn't check." A future improvement
  would surface that distinction explicitly.

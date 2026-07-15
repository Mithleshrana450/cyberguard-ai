# Module 4: Mini SIEM

## What was built
- Every login attempt (success or failure) logged to `login_events`
- Redis-backed brute-force detection: 5 failed logins from the same IP
  within 5 minutes triggers a `security_alerts` row
- `GET /api/v1/siem/alerts` and `GET /api/v1/siem/events` - restricted to
  `admin`/`analyst` roles via Module 1's `require_role()`, used here for
  the first time in a real feature
- Frontend SIEM page with a friendly "restricted" message for `viewer`
  accounts, backed by the real server-side 403
- 9 new tests: pure counting-logic tests (fake Redis, no server needed)
  + API-level tests proving the full login → alert pipeline

## API Reference

### GET /api/v1/siem/alerts
Returns recent security alerts, newest first. **Requires `admin` or `analyst` role.**

### GET /api/v1/siem/events
Returns recent login events (success and failure), newest first. **Requires `admin` or `analyst` role.**

Both return `403 Forbidden` for a `viewer` role - even with a perfectly
valid access token, since RBAC role, not just authentication, is being
checked.

## Design decisions worth understanding

**Why Redis, concretely, not just "because it's fast":**
The brute-force counter needs to (1) increment atomically under concurrent
requests, and (2) automatically forget itself after 5 minutes. Redis's
`INCR` + `EXPIRE` gives us both for free, in two single commands, with no
cleanup cron job. Doing the equivalent in Postgres would mean a query like
"count login_events where ip = X and created_at > now() - 5 minutes" on
every single login attempt - correct, but a much heavier query to run at
high frequency compared to an in-memory counter increment.

**Dependency injection for Redis, mirroring `get_db`:**
The login route uses `Depends(get_redis)` rather than importing the Redis
client directly - the exact same pattern Postgres sessions have used since
Module 0. This is what let tests substitute a lightweight in-memory
`FakeRedis` class instead of needing a real Redis server running during
`pytest`.

**Fire-once alerting:** the alert is created exactly when the failure
count *crosses* the threshold (`count == 5`), not on every failure after
that. Without this, an ongoing attack would flood the alerts table with a
new row per failed attempt - the dedup logic keeps one alert meaningfully
representing one incident.

## Known tradeoffs
- IP-only tracking - a distributed attack spreading requests across many
  IPs wouldn't trigger this detection. Real-world SIEM tools correlate
  across IPs/ASNs; that's a natural extension for the future Threat
  Intelligence module.
- `request.client.host` is the direct TCP connection IP - behind a reverse
  proxy (planned for the DevOps/Nginx module), this would need to read
  `X-Forwarded-For` instead, which requires the proxy to be configured to
  set it safely (an unvalidated `X-Forwarded-For` can be spoofed by the
  client itself).
- No automatic response to a detected brute force (e.g. temporarily
  blocking the IP) - this module only *detects and alerts*. Automated
  blocking is a meaningfully bigger decision (false positives lock out
  real users) better suited to a deliberate future module with its own
  design discussion.

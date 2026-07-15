# Module 5: Threat Intelligence

## What was built
- IP, domain, URL, and file hash lookups against VirusTotal's aggregated
  vendor data (70+ security engines)
- Redis caching (1 hour TTL) to stay within VirusTotal's free-tier rate
  limit (4 requests/minute)
- Full lookup history per user
- 13 new tests: pure response-interpretation logic (no network) + API
  tests with VirusTotal mocked, including a test that specifically proves
  the cache prevents a second external API call

## Setting up your own API key (required for this module to work)

1. Go to https://www.virustotal.com/gui/join-us and create a free account
2. Once logged in, click your profile icon → **API Key**
3. Copy the key shown there
4. Open your `.env` file (NOT `.env.example` - your real, gitignored one)
   and set:
   ```
   VIRUSTOTAL_API_KEY=your-actual-key-here
   ```
5. Restart the backend: `docker compose restart backend`

Without this key set, the API returns a clear `503` explaining what's
missing, rather than crashing - see `_vt_lookup()` in
`threat_intel_service.py`.

## API Reference

### POST /api/v1/threat-intel/lookup
**Request:** `{ "lookup_type": "ip" | "domain" | "url" | "hash", "value": "..." }`

**Response `201`:** includes `verdict` (`malicious` / `suspicious` /
`clean` / `unknown`), vendor counts, and a human-readable `summary`.

**Errors:** `503` if no API key configured, `502` if VirusTotal rejects
the key or the request fails, `429` if VirusTotal's own rate limit is hit.

### GET /api/v1/threat-intel/history
Returns the current user's past lookups, newest first.

## Design decisions worth understanding

**Why `unknown` is a real, separate verdict from `clean`:**
VirusTotal returning "0 vendors flagged this malicious" because they
*analyzed it and found nothing* is meaningfully different from "no vendor
has ever seen this before" (a 404 from their API). Collapsing both into
"clean" would overstate confidence about something nobody has actually
looked at.

**Caching is keyed by exact type + value, not fuzzy-matched:**
`threat_intel:ip:8.8.8.8` and `threat_intel:domain:8.8.8.8` (if someone
typed an IP into the domain field) are different cache entries
deliberately - the lookup TYPE changes which VirusTotal endpoint and
response shape is involved.

**URL lookups don't submit new URLs for analysis.**
VirusTotal's API distinguishes "check if this URL has already been
analyzed" (a GET, what we do) from "submit this URL for a *new* analysis"
(a POST that queues a scan and requires polling for results, more
complex). We only implement the GET/lookup path - scanning a URL nobody's
ever submitted before will return `unknown`, not trigger a fresh scan.
This is a deliberate scope cut, not an oversight, and would be the
natural next step if this module were extended.

## Known tradeoffs
- Single shared API key for the whole platform (from environment config),
  not per-user keys - simpler, but means the 500/day quota is shared
  across everyone using the deployed instance. A future improvement could
  let each user supply their own key in their profile settings.
- No automatic re-check/refresh of stale lookups - a lookup from a week
  ago just sits in history with whatever verdict it had at the time.

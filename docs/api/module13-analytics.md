# Module 13: Analytics

## What was built
- Platform-wide (not per-user) aggregation across five modules: alert
  trends, incident trends, scan score distribution, finding/alert/phishing
  severity distributions, and executive summary KPIs
- Configurable time window (7/30/90 days), clamped server-side
- 15 new tests, including one that seeds a real scan through the actual
  scanner endpoint and proves the analytics aggregation correctly reflects it

## API Reference

### GET /api/v1/analytics/summary?days=30
Requires admin or analyst. days is clamped to 1-90 server-side.

Returns alert_trend[], incident_trend[] (daily buckets, zero-filled),
three severity/risk distributions, and an executive_summary object with
platform-wide totals and the incident resolution rate.

## Design decisions worth understanding

**Platform-wide scope, a deliberate break from the per-user pattern.**
Every prior history-producing module (Scanner, Threat Intel, Phishing)
scoped queries to user_id == current_user.id. Analytics drops that filter
entirely - an executive view needs "how is the organization doing," not
"how is this one account doing." This is exactly why RBAC restricts it to
admin/analyst: it's now showing everyone's data, not just your own.

**Zero-filled day buckets, not sparse data.**
bucket_by_day() always returns exactly `days` entries, including days
with zero events. A trend chart with silently missing dates for quiet
days would look like broken data, not "nothing happened" - explicit
zeros are the honest representation.

**Fixed score bands, not dynamic histogram binning.**
compute_score_distribution() always buckets into the same three named
ranges (critical/needs-improvement/good) regardless of how much data
exists. A histogram whose bin boundaries shift as more scans come in
would make month-over-month comparison meaningless - fixed, meaningful
bands stay comparable over time.

**Charts built with plain CSS, no new charting library.**
TrendBarChart and DistributionBar are small custom components using
height/width percentages - deliberately avoiding a new dependency
(recharts, chart.js) for two straightforward visualizations that plain
CSS handles well, keeping the bundle lean this late in the project.

## Known tradeoffs
- No per-organization/team scoping - "platform-wide" currently means
  "every user in this single-tenant deployment." A genuinely multi-tenant
  version would need an organization/workspace concept, out of scope here.
- No export of analytics charts themselves (only Module 11's Reports
  exports data) - a reasonable future integration point between the two
  modules.
- Trend granularity is daily only - no weekly/monthly rollup option for
  longer time windows, where daily bars would get visually noisy.

---

## All 14 modules complete

With Analytics, every module from the original roadmap is built, tested,
and documented:

0. Foundation & Docker environment
1. Authentication & RBAC
2. Dashboard
3. Website Security Scanner
4. Mini SIEM
5. Threat Intelligence
6. Digital Forensics
7. Phishing Detection
8. Network Monitoring
9. AI Security Assistant
10. Incident Management
11. Reports
12. Admin Panel
13. Analytics

190 backend tests, real integrations with VirusTotal and OpenAI, an
enforced authorization boundary on the network scanner, a real
Redis-backed brute-force detector, a real PDF generator, and a
consistent design system across every page. This is a complete,
demonstrable platform.

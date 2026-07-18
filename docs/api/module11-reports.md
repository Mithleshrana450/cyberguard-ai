# Module 11: Reports

## What was built
- PDF Security Audit Summary - executive summary + recent scans, alerts,
  and incidents, generated server-side with reportlab
- CSV export for every module's history (scans, alerts, threat-intel,
  phishing, network, incidents) via one generic export endpoint
- JSON summary endpoint (also powers the frontend's stat cards)
- 20 new tests, including real (non-mocked) PDF generation verified by
  checking actual PDF magic-number bytes, not just "did it not crash"

## API Reference

### GET /api/v1/reports/summary
Aggregated counts and recent items across every module - average
security score, alert/incident counts, and the 5 most recent scans/
alerts/incidents.

### GET /api/v1/reports/csv/{report_type}
report_type is one of: scans, alerts, threat-intel, phishing, network,
incidents. Returns a downloadable CSV file.

### GET /api/v1/reports/pdf
Returns a downloadable PDF security audit summary.

## Design decisions worth understanding

**One generic CSV function, not six.**
dicts_to_csv() takes any list of dicts and produces CSV - it doesn't know
or care whether the rows came from scans or incidents. The per-module
work is entirely in report_data.py, producing the right list of
normalized dicts. Adding a 7th export type later means adding one
function to report_data.py, not touching the CSV or API layer at all.

**reportlab's Platypus, not the low-level Canvas API.**
Platypus flowables (Paragraph, Table, Spacer) handle page-break logic
automatically - if a user has enough scan history that the table
overflows one page, Platypus continues it onto the next page correctly.
Doing that manually with Canvas (calculating exact Y-coordinates and
detecting when to start a new page) is real, fiddly work that Platypus
handles for free.

**File downloads authenticate through the API client, not a plain link.**
A plain anchor tag pointing at a protected endpoint wouldn't carry the
JWT Bearer token our routes require. The frontend instead fetches the
file through the authenticated api client as a blob, then constructs a
temporary object URL to trigger the browser's normal save dialog - the
standard pattern for downloading protected files in an SPA.

**Verified PDF tests check the actual magic-number header (%PDF-).**
A test that just checks "the function didn't raise an exception" would
pass even if reportlab silently produced corrupted output. Checking the
first 5 bytes match the real PDF file signature is a small thing that
makes the test actually prove something.

## Known tradeoffs
- No CSV escaping edge cases beyond what Python's csv module handles by
  default (standard, correct behavior - relying on the standard library
  rather than hand-rolling anything).
- The PDF report is a fixed template (one layout, no customization
  options) - a natural extension would be letting a user choose which
  sections to include, or a date-range filter.
- Report generation is synchronous - for a user with a very large history
  across many modules, PDF generation could take a couple of seconds.
  Fine at this scale; a background job would be the fix if this ever
  became slow (same escape hatch mentioned since Module 4).

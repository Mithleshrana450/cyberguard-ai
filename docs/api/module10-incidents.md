# Module 10: Incident Management

## What was built
- Incidents with a proper status workflow (open -> investigating ->
  resolved -> closed), enforced as a real state machine, not a free dropdown
- Investigation notes, addable by any authenticated user
- Differentiated RBAC: anyone can create/view/note; only admin/analyst
  can change status, severity, or assignment
- Optional loose linking (source_type / source_id) back to whatever
  triggered the incident
- 23 new tests, including exhaustive coverage of every valid and invalid
  state transition

## The state machine rule that matters most

An incident cannot jump directly from `open` to `closed` - it must pass
through `resolved` first. This is tested explicitly
(`test_admin_cannot_skip_from_open_to_closed`) and mirrored in the
frontend (the UI only offers valid next-states as buttons), but the
backend is the actual enforcement point - the frontend restriction is
convenience, not the security boundary.

## API Reference

### POST /api/v1/incidents
Any authenticated user. `{ title, description, severity, source_type?, source_id? }`

### GET /api/v1/incidents / GET /api/v1/incidents/{id}
Any authenticated user. Optional `?status_filter=investigating` on the list.

### PATCH /api/v1/incidents/{id}
**Requires admin or analyst.** `{ status?, assigned_to?, severity? }`
**Errors:** `400` if the requested status transition isn't valid from the
current status.

### POST /api/v1/incidents/{id}/notes
Any authenticated user. `{ content }`

## Design decisions worth understanding

**RBAC differentiation, not blanket gating.**
Every prior RBAC-restricted module (SIEM, Network Monitoring) used
all-or-nothing role checks per endpoint. Incidents differentiate WITHIN
one resource: viewing and commenting are open to everyone, but changing
official status is restricted. This is closer to how real tools like
Jira or PagerDuty actually split permissions, and it's a more realistic
pattern to have in a portfolio project than uniform gating everywhere.

**closed_at is derived, not independently settable.**
The API doesn't accept a closed_at field from the client - it's set
automatically the moment status becomes CLOSED, and cleared the moment
status moves away from CLOSED. This guarantees the timestamp always
reflects reality rather than trusting the client to keep two related
fields in sync.

**Loose string-based source linking, not a polymorphic foreign key.**
An incident might originate from a SIEM alert, a scan finding, a phishing
check, or nothing at all (manually reported). A real polymorphic foreign
key across five different source tables is possible in SQLAlchemy but
adds real complexity for a benefit this project doesn't need yet -
source_type/source_id as plain strings is a pragmatic middle ground,
documented as a conscious simplification.

## Known tradeoffs
- No email/notification on assignment or status change - a natural fit
  for a future Reports/notifications enhancement.
- source_type/source_id aren't validated against real records (no FK
  enforcement) - an incident could reference a since-deleted finding.
  Acceptable for now since it's informational, not load-bearing.
- No incident templates or auto-creation from alerts yet - every incident
  is currently created manually, even though the schema supports linking
  to an origin. Auto-escalation (e.g. "critical SIEM alert automatically
  creates an incident") is a natural next step, not built here.

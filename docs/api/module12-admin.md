# Module 12: Admin Panel

## What was built
- User management: list all users, change role, activate/deactivate
- Self-protection guard: an admin can never demote or deactivate their
  own account through this panel
- Audit logging: every role change, activation toggle, and settings
  change is recorded with who did it and when
- Platform settings, with one genuinely wired to real behavior: the SIEM
  brute-force threshold (Module 4) is now admin-configurable and takes
  effect immediately, no restart needed
- RBAC restricted to admin only - the first module where analyst is also
  rejected, not just viewer
- 18 new tests, including one that changes a setting through the real API
  and then proves the SIEM module's behavior actually changed

## The most important test in this module

```python
def test_changing_brute_force_threshold_actually_changes_siem_behavior(client):
    client.patch(".../settings/brute_force_threshold", json={"value": "2"}, ...)
    # 2 failed logins now triggers what used to require 5
    client.post("/api/v1/auth/login", ...)  # x2
    alerts = client.get("/api/v1/siem/alerts", ...).json()
    assert len(alerts) == 1
```

This is what separates a real settings feature from a UI shell that saves
values nobody reads. Two of the three seeded settings (platform_name,
support_email) are honestly labeled as informational-only for now -
following the same honesty pattern used since Module 2's placeholder
dashboard zeros, rather than pretending every setting has real effect.

## API Reference

### GET /api/v1/admin/users
Admin only.

### PATCH /api/v1/admin/users/{id}
Admin only. `{ role?, is_active? }`
Errors: 400 if attempting to change your own role away from admin or
deactivate your own account - this is the safety boundary, not a bug.

### GET /api/v1/admin/audit-logs
Admin only. Every user-management and settings action, newest first.

### GET /api/v1/admin/settings / PATCH /api/v1/admin/settings/{key}
Admin only.

## Design decisions worth understanding

**Self-protection is enforced in the service layer, not just the UI.**
The frontend disables the role dropdown and active-toggle button for your
own row, but that's convenience - update_user() in admin_service.py
raises 400 independently of what the frontend sent, so there's no way to
bypass this by calling the API directly (e.g. via Swagger or curl).

**Settings seeded directly in the migration, not at app startup.**
op.bulk_insert() in the migration guarantees the three default settings
exist the moment the migration runs, regardless of app boot order. Tests
mirror this by calling the same seed_default_settings() helper in
conftest.py's fixture - both paths use the identical seeding logic, so
what tests verify matches what production actually does.

**No-op updates don't create audit log noise.**
Setting a user's role to the value it already has doesn't write an audit
log entry - update_user() only logs actual changes. An audit trail that
records every no-op click is harder to actually use for investigation
than one that only records genuine changes.

## Known tradeoffs
- Only one setting (brute_force_threshold) has real wired effect; the
  other two are informational placeholders, honestly labeled as such.
- No "undo" on user role changes - the audit log records what changed,
  but reverting requires a manual second change, not a one-click revert.
- Self-protection only covers the two most dangerous single-admin-lockout
  scenarios (role demotion, deactivation) - it doesn't prevent, say, an
  admin deleting the only other admin account (no user deletion exists
  yet, only deactivation, which is itself a safer design choice).

# Module 1: Authentication & RBAC

## What was built
- User registration and login with bcrypt password hashing
- JWT access tokens (30 min expiry) + refresh tokens (7 day expiry, stored as hashes)
- Role-based access control (`admin`, `analyst`, `viewer`) enforceable per-route
- Logout with token revocation
- 10 passing automated tests covering the full auth flow

## API Reference

### POST /api/v1/auth/register
Creates a new user account. No authentication required.

**Request body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123",
  "full_name": "Alexa Sharma"
}
```

**Response `201 Created`:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "student@example.com",
  "full_name": "Alexa Sharma",
  "role": "viewer",
  "is_active": true,
  "created_at": "2026-07-14T10:00:00Z"
}
```

**Errors:** `409 Conflict` if the email is already registered.

---

### POST /api/v1/auth/login
Verifies credentials and issues tokens. No authentication required.

**Request body:**
```json
{ "email": "student@example.com", "password": "SecurePass123" }
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "NXXmvaHcRLpJQD0q...",
  "token_type": "bearer"
}
```

**Errors:** `401 Unauthorized` for wrong credentials, `403 Forbidden` if the account is disabled.

---

### POST /api/v1/auth/refresh
Exchanges a valid refresh token for a new access token.

**Request body:** `{ "refresh_token": "..." }`
**Response `200 OK`:** same shape as `/login`
**Errors:** `401 Unauthorized` if the refresh token is invalid, expired, or revoked.

---

### POST /api/v1/auth/logout
Revokes a refresh token. Requires a valid access token.

**Headers:** `Authorization: Bearer <access_token>`
**Request body:** `{ "refresh_token": "..." }`
**Response:** `204 No Content`

---

### GET /api/v1/auth/me
Returns the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <access_token>`
**Response `200 OK`:** same shape as the register response
**Errors:** `401 Unauthorized` if the token is missing, invalid, or expired.

## RBAC usage in future modules
Any future route can restrict access by role with one line:

```python
from app.core.deps import require_role
from app.models.user import UserRole

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: User = Depends(require_role(UserRole.ADMIN))):
    ...
```

## Known tradeoffs (documented deliberately, not oversights)
- Changing a user's role takes up to 30 minutes to apply (their existing
  access token still carries the old role until it expires). This is the
  standard JWT tradeoff for stateless auth speed. If instant role changes
  become a requirement, the fix is a "token version" field checked against
  the database on every request - at the cost of losing full statelessness.
- No password reset flow yet (mentioned in the master brief) - deliberately
  deferred, since it needs an email-sending service which isn't set up
  yet. Good candidate for a Module 1.1 once SMTP/email is configured.
- No rate limiting on `/login` yet (brute-force protection) - this is
  planned for the Mini SIEM module, which will detect and block repeated
  failed logins as an actual SIEM feature, not just infra middleware.

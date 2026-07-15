# Module 2: Dashboard

## What was built
- Backend: `GET /api/v1/dashboard/summary` - protected endpoint returning
  honest placeholder data (real numbers arrive as later modules are built)
- Frontend: full auth flow with real forms (Login, Register), a persistent
  session via silent token refresh, protected routing, and the dashboard
  shell (sidebar + topbar + widgets) every future module plugs into
- A deliberate design system (see below) instead of default dark-mode styling

## Design system
| Token | Value | Reasoning |
|---|---|---|
| `background` | `#0A0E14` | Deep navy-charcoal, not pure black - softer on the eyes for a dashboard viewed for long stretches |
| `accent` | `#4FD1C5` | Teal - reads as "monitoring/scanning," avoids the generic neon-green/vermilion AI-default |
| `safe` / `warning` / `critical` | green/amber/red | Functionally motivated - standard SOC alert semantics, not decoration |
| Body font | Inter | Clean, technical, highly legible at small sizes |
| Data font | JetBrains Mono | Used for scores, counts, IDs - anything data-like, matching how real security tools render logs/hashes/IPs |

**Signature element:** a one-time "scan sweep" animation across the Security
Score card on load - evokes a radar pass, used in exactly one place,
respects `prefers-reduced-motion`.

## Frontend architecture decisions

**Token storage split** (access token in memory, refresh token in
`localStorage`) - see the Module 2 chat explanation for the full XSS
tradeoff discussion. This is a deliberate, documented weaker link, not an
oversight - a future hardening pass would move the refresh token to an
httpOnly cookie.

**`conftest.py` for backend tests** - fixed a real bug where an
`autouse` fixture defined inside `test_auth.py` didn't apply to
`test_dashboard.py` even though it imported from that file. pytest only
auto-applies `autouse` fixtures within the same file or a shared
`conftest.py` - moving shared setup there fixed cross-file test isolation.

## Known tradeoffs
- Sidebar lists all planned modules now (greyed out, marked "soon") so the
  platform's full scope is visible immediately - useful for a portfolio
  demo, but means some nav items are intentionally non-functional until
  their modules are built.
- No dark/light theme toggle - dark-only, matching the SOC-console design
  brief. Could be added later if needed.

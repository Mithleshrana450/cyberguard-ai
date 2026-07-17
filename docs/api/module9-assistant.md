# Module 9: AI Security Assistant

## What was built
- Persistent, multi-turn chat with an AI security assistant (reuses
  `OPENAI_API_KEY` from Module 7 - nothing new to configure)
- Automatic context injection: every message includes a fresh summary of
  the user's latest scan score, critical findings, active SIEM alerts,
  malicious threat-intel verdicts, risky phishing checks, and recent
  network scan results - pulled live from five different modules' tables
- Conversation history persisted per user, capped at the last 10 messages
  sent to the API per turn (cost control, full history still stored)
- 13 new tests: pure context-formatting logic (no DB, no network) + API
  tests with the AI call mocked, including one that specifically proves
  the context summary actually reaches the AI call

## API Reference

### POST /api/v1/assistant/chat
**Request:** `{ "message": "What's my biggest risk right now?" }`
**Response `201`:** `{ user_message, assistant_message }`, both full
message objects with `id`, `role`, `content`, `created_at`.

**Errors:** `503` if `OPENAI_API_KEY` isn't configured, `502` if the
OpenAI call fails, `504` if it times out (30s limit).

### GET /api/v1/assistant/history
Full conversation history, oldest first.

### DELETE /api/v1/assistant/history
Clears all messages for the current user - "start a new chat."

## Design decisions worth understanding

**Context is gathered fresh on every message, not cached.**
Unlike Module 5's threat-intel lookups (deliberately cached for an hour),
security context here needs to reflect the CURRENT state - if a new
critical alert fired 30 seconds ago, the next message should know about
it. The tradeoff is a few extra DB queries per chat message, which is
cheap compared to the AI call itself.

**Two-function split, same principle as every prior module.**
`build_context_summary()` takes a plain dict and returns formatted text -
no DB, no network, fully unit tested with synthetic data.
`gather_user_security_context()` does the actual querying across five
modules' tables. This is what let us write a test that specifically
proves the context summary reaches the AI call
(`test_chat_passes_context_summary_to_ai_call`) without needing real
scan/alert data seeded in the test database.

**Hard failure on missing API key, unlike Module 7.**
Module 7's phishing detection has a complete, useful heuristics-only mode
- the AI explanation is a bonus. There's no equivalent fallback for a
conversational assistant; without the AI call, there's no assistant. So
this module returns a clear `503` rather than pretending to work.

**System prompt explicitly refuses attack instructions.**
Even framed as "educational," the assistant is instructed to explain
concepts and defenses rather than provide actual attack how-tos - a
deliberate guardrail appropriate for a tool aimed at students learning
defensive security, not offensive tooling.

## Known tradeoffs
- Conversation history is capped at 10 messages sent per API call to
  control token cost - very long conversations will "forget" early
  context, though it remains stored and visible in the UI.
- SIEM alert count in the context (`active_siem_alerts`) is platform-wide,
  not per-user - consistent with Module 4's design (alerts describe
  attacker behavior against the whole system, not one user's account).
- No streaming responses - the full reply is waited for before displaying,
  rather than token-by-token. A reasonable future enhancement, not
  essential for the assistant to be useful.

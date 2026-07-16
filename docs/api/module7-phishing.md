# Module 7: Phishing Detection

## What was built
- URL heuristic analysis: IP-address hosts, `@` symbol tricks, URL
  shorteners, Punycode/homograph detection, typosquat detection against
  common brands, excessive subdomain counts
- Email heuristic analysis: From/Reply-To domain mismatch, urgency
  language detection, automatic extraction and re-analysis of any URLs
  found in the email body (reusing the URL analyzer)
- Weighted 0–100 risk scoring with four risk levels (low/medium/high/critical)
- Optional AI-generated plain-English explanation via OpenAI, best-effort
  (analysis works fully without it configured)
- 21 new tests: pure heuristic logic (no network) + API tests with the AI
  call mocked

## Setting up the optional AI explanation

1. Get an API key at https://platform.openai.com/api-keys (this one is
   **paid**, usage-based - unlike VirusTotal's free tier. Cost for this
   feature is small - a few hundred analyses cost well under $1 with
   `gpt-4o-mini`, but it isn't free like Module 5's key)
2. Add to your `.env`:
   ```
   OPENAI_API_KEY=your-actual-key-here
   ```
3. Restart the backend: `docker compose restart backend`

Without this key, `ai_explanation` is simply `null` in every response -
the heuristic findings and risk score are unaffected either way.

## API Reference

### POST /api/v1/phishing/analyze-url
**Request:** `{ "url": "http://paypa1.com/login" }`
**Response `201`:** `risk_score`, `risk_level`, `findings_json` (array of
heuristic findings), `ai_explanation` (nullable)

### POST /api/v1/phishing/analyze-email
**Request:** `{ "raw_email": "From: ...\nSubject: ...\n\nBody text..." }`
Same response shape. Any URLs found in the email body are automatically
extracted and analyzed too - findings from both the email-level checks
and the embedded URLs' checks are combined into one result.

### GET /api/v1/phishing/history
Returns the current user's past analyses. Only a truncated 320-character
preview of the original input is stored, not the full raw email
indefinitely - see the design notes below.

## Design decisions worth understanding

**Why store only an input preview, not the full raw email.**
Emails can contain genuinely sensitive personal content. Storing an
indefinite history of full email bodies "just in case" is a real data
liability - the truncated preview is enough for the history list to be
useful (recognizing what you checked) without accumulating that risk.

**Why the AI explanation is architecturally optional, not a hard dependency.**
This follows the exact same best-effort pattern established in Module 6
(the threat-intel cross-check on uploaded files): `generate_explanation()`
catches every failure mode internally and returns `None` rather than
raising, so a slow OpenAI response, a rate limit, or a missing key never
blocks the heuristic analysis, which is fast, free, and fully sufficient
on its own.

**Threshold-tuning caught a real false positive during testing.**
The typosquat similarity check initially used a 0.75 similarity threshold
and genuinely flagged `example.com` as suspiciously similar to
`apple.com` (0.80 ratio) - an unrelated domain. Writing the test
`test_analyze_url_does_not_flag_legitimate_brand_domain` caught this
before it shipped; the threshold was raised to 0.85. This is a concrete
example of why testing heuristic/scoring logic matters even when there's
no "obvious" bug - false positives in security tooling erode trust fast.

## Known tradeoffs
- The typosquat brand list is a small, hardcoded set (10 common brands) -
  not exhaustive. A production version would use a much larger, maintained
  list or a proper phishing-domain feed.
- Simple string-similarity typosquat detection has real limits: it catches
  character-substitution squats well (`paypa1.com`) but misses
  word-addition squats (`paypal-secure.com` scores lower similarity to
  `paypal.com` than the false positive we fixed did) - a more
  sophisticated approach would check for the brand name as a substring
  combined with extra tokens, not just overall string similarity.
- No actual email header authentication checks (SPF/DKIM/DMARC
  verification) - those require the raw email's authentication-results
  headers as provided by a receiving mail server, which a
  pasted-in-by-hand email typically won't include. A future integration
  point if this module connects to a real mailbox.

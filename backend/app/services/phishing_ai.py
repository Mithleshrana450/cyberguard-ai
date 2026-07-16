"""
AI-generated phishing explanation.

Called via `requests` directly against OpenAI's REST API, rather than the
official `openai` SDK - keeps the dependency footprint identical to
Module 5's VirusTotal integration (one `requests` call, mockable in tests
the same way) instead of introducing a second, differently-versioned SDK.

This function is intentionally BEST-EFFORT: any failure (no API key,
network issue, rate limit) returns None rather than raising, so a
phishing analysis is never blocked by the AI layer being unavailable -
the heuristic findings alone are still a complete, useful result.
"""

import requests

from app.core.config import settings

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
REQUEST_TIMEOUT = 15

SYSTEM_PROMPT = (
    "You are a cybersecurity analyst assistant. Given a list of automated heuristic "
    "findings about a URL or email, write a concise (2-4 sentence) plain-English "
    "explanation of the overall risk for a non-technical user. Do not repeat the "
    "findings verbatim - synthesize them into a clear takeaway and a recommended action."
)


def generate_explanation(findings_summary: str, risk_score: int) -> str | None:
    if not settings.OPENAI_API_KEY:
        return None

    try:
        response = requests.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Risk score: {risk_score}/100\nFindings:\n{findings_summary}",
                    },
                ],
                "max_tokens": 200,
                "temperature": 0.3,
            },
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except (requests.RequestException, KeyError, IndexError):
        return None

"""
AI assistant chat call.

Unlike Module 7's generate_explanation() (best-effort, returns None on
failure), this function RAISES on failure - the assistant IS the feature
here, there's no meaningful fallback response to give instead.
"""

import requests
from fastapi import HTTPException, status

from app.core.config import settings

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
REQUEST_TIMEOUT = 30

SYSTEM_PROMPT = (
    "You are the CyberGuard AI Security Assistant, embedded in a cybersecurity platform. "
    "You help users understand vulnerabilities, recommend mitigations, summarize their "
    "security alerts, and answer general security questions. Be concise, practical, and "
    "avoid unnecessary jargon. When the user's current security context is provided, ground "
    "your answers in it rather than speaking generically. Never provide instructions for "
    "actually carrying out an attack, even if framed as educational - explain concepts and "
    "defenses instead."
)


def generate_assistant_reply(context_summary: str, conversation: list[dict]) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "The AI assistant is not configured. Set OPENAI_API_KEY in the environment "
            "(see docs/api/module9-assistant.md).",
        )

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context_summary}"},
        *conversation,
    ]

    try:
        response = requests.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": "gpt-4o-mini", "messages": messages, "max_tokens": 500, "temperature": 0.4},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except requests.exceptions.Timeout:
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, "The AI assistant took too long to respond.")
    except (requests.RequestException, KeyError, IndexError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"AI assistant request failed: {exc}")

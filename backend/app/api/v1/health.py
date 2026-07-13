"""
Health check endpoint.

Why this exists:
Every production system needs a "/health" endpoint. It's used by:
  - Docker (to know when the container is ready to receive traffic)
  - Load balancers / orchestrators (to decide whether to route traffic here)
  - You, right now, to prove backend + frontend + Docker are wired together
    correctly before we add any real features.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "CyberGuard AI Backend",
    }

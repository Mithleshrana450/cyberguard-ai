"""
FastAPI application entrypoint.

This file's ONLY job is to:
  1. Create the FastAPI app instance.
  2. Wire up middleware (CORS).
  3. Include routers from app/api/.

No business logic lives here - that's the "thin entrypoint" principle.
As we add modules (auth, scanner, SIEM, etc.), each gets its own router
file in app/api/v1/ and gets included below with one line.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import health, auth, dashboard, scanner, siem

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Cybersecurity Management Platform",
    version="0.1.0",
    docs_url="/api/docs",       # Swagger UI
    redoc_url="/api/redoc",     # ReDoc alternative UI
    openapi_url="/api/openapi.json",
)

# CORS: without this, the React frontend (running on a different port/origin)
# would be blocked by the browser from calling this API. We restrict allowed
# origins via settings rather than using "*", which is an OWASP-flagged
# misconfiguration in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers - each module we build gets one line here.
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(scanner.router, prefix="/api/v1")
app.include_router(siem.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root():
    return {"message": f"{settings.APP_NAME} API is running. See /api/docs for documentation."}

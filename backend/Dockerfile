# --- Base image ---
# Using slim variant: much smaller image size than full python:3.12, which
# matters for build speed, storage, and reduces attack surface (fewer
# preinstalled packages = fewer potential vulnerabilities).
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed to build psycopg2 (PostgreSQL driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first, separately from app code.
# Why: Docker caches layers. If only your app code changes (not
# requirements.txt), Docker reuses the cached pip install layer instead of
# reinstalling every dependency on every build. This makes rebuilds seconds
# instead of minutes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as a non-root user - a basic container security best practice.
# If an attacker exploits the app, they don't get root inside the container.
RUN useradd -m appuser
USER appuser

EXPOSE 8000

CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"

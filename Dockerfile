# ==============================================================================
# Stage 1: Build React 19 Frontend SPA with Vite
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python ASGI Backend (FastAPI + Uvicorn)
# ==============================================================================
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    HOST=0.0.0.0

# Install runtime utilities & create unprivileged security user
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 appuser

# Install Python requirements
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r ./server/requirements.txt

# Copy server code
COPY server/ ./server/

# Copy built frontend assets into the expected directory
COPY --from=frontend-builder /app/client/dist ./client/dist

# Set permissions for unprivileged user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

WORKDIR /app/server

CMD ["python", "run.py"]

# ==========================================
# CybeWatch AI - Multi-Stage Production Dockerfile
# ==========================================

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Runtime
FROM python:3.12-slim AS runner

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source, datasets, and artifacts
COPY backend/ ./backend/
COPY datasets/ ./datasets/
COPY artifacts/ ./artifacts/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment settings
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend
ENV ENVIRONMENT=production

EXPOSE 8000

# Run uvicorn server
WORKDIR /app/backend
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

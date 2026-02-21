# Worker Dockerfile (Python + FastAPI + Celery)
FROM python:3.11-slim AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY apps/worker/requirements.txt ./apps/worker/
RUN pip install --no-cache-dir -r apps/worker/requirements.txt

# Copy application code
COPY apps/worker ./apps/worker
COPY packages/shared ./packages/shared

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

# Create non-root user
RUN useradd -m -u 1001 worker

USER worker

EXPOSE 8000

WORKDIR /app/apps/worker

# Run FastAPI with uvicorn
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


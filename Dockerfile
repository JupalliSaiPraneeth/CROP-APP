# Production Dockerfile for CropAI 5-Model FastAPI Backend
# Supports Render, Railway, Hugging Face Spaces, Fly.io, and Cloud VPS

FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    MODELS_DIR=/app/models \
    REPORTS_DIR=/app/reports \
    CORS_ORIGINS="*"

WORKDIR /app

# Install system runtime dependencies for OpenCV and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-optimized PyTorch first to save ~3GB of GPU CUDA overhead
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch>=2.0.0 --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install backend dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application backend source code
COPY backend /app/backend

# Copy trained AI model weights and metadata
COPY models /app/models

# Copy sample test images and reports directory
COPY test_images /app/test_images
COPY reports /app/reports

# Ensure reports directory is writable for runtime diagnostics
RUN mkdir -p /app/reports && chmod -R 777 /app/reports

EXPOSE 8001

# Healthcheck to monitor backend uptime
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/api/health || exit 1

# Launch FastAPI via Uvicorn
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1"]

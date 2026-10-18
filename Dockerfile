# Production Dockerfile for CropAI 5-Model FastAPI Backend
# Optimized for low-RAM cloud containers (Render Free Tier 512MB, Railway, HF Spaces)

FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000 \
    MODELS_DIR=/app/models \
    REPORTS_DIR=/app/reports \
    PEST_GUARD_ENABLED=false \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
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
    pip install --no-cache-dir torch>=2.0.0 torchvision --index-url https://download.pytorch.org/whl/cpu

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

EXPOSE 10000 8001

# Healthcheck to monitor backend uptime
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# Launch FastAPI via Uvicorn (binds immediately to Render's $PORT or 10000)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]

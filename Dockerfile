# Optimized Dockerfile for Aiven deployment (root directory)
# This builds the score server from the score_server subdirectory

FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY score_server/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user first (before copying Python packages)
RUN useradd --create-home --shell /bin/bash --uid 1000 appuser \
    && mkdir -p /app/logs

# Copy Python packages from builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Set PATH to include user local bin (fixes PATH warnings)
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy application code from score_server directory
COPY score_server/app/ ./app/

# Set ownership after copying everything
RUN chown -R appuser:appuser /app /home/appuser/.local

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Remove HEALTHCHECK (not supported in OCI format used by Aiven)
# Health check will be handled by Aiven's platform

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
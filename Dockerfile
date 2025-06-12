# Use Python 3.9 as the base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend package files first to leverage Docker cache
COPY frontend/package*.json frontend/

# Install frontend dependencies (changed from npm ci to npm install)
RUN cd frontend && npm install --only=production

# Copy frontend source code and build
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy application code
COPY . .

# Create results directory
RUN mkdir -p results

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application with host set to 0.0.0.0
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
# Stage 1: Build Frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend and Final Image
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from stage 1 into the 'static' folder inside backend
COPY --from=frontend-builder /app/frontend/dist /app/static

# ── Security: Production defaults ────────────────────────────────────────────
# Docs (Swagger/ReDoc) are disabled when APP_ENV=production.
# Override ALLOWED_ORIGINS at runtime: docker run -e ALLOWED_ORIGINS=https://... 
ENV APP_ENV=production
ENV ALLOWED_ORIGINS=""

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Start FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]

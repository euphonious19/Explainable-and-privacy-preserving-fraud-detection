"""
FraudShield — FastAPI Backend
Privacy-Preserving Federated Fraud Detection System

Research-aligned implementation:
- Federated Learning (SGDClassifier / LogisticRegression)
- Graph Neural Network (GraphSAGE-inspired, precomputed embeddings)
- Decision-Level Integration Engine (rule-based, no feature fusion)
- SHAP + LIME Explainability
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager
import uvicorn
import logging

from routers import predict, explain, metrics

logging.basicConfig(level=logging.INFO, format="%(asctime)s — %(name)s — %(levelname)s — %(message)s")
logger = logging.getLogger("FraudShield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 FraudShield API starting up...")
    logger.info("📦 Loading FL model...")
    from models.fl_model import FederatedModel
    app.state.fl_model = FederatedModel()
    logger.info("🔗 Loading GNN model...")
    from models.gnn_model import GNNModel
    app.state.gnn_model = GNNModel()
    logger.info("✅ All models loaded. FraudShield is ready.")
    yield
    logger.info("🛑 FraudShield API shutting down...")


# ── Environment ────────────────────────────────────────────────────────────
IS_DEV = os.getenv("APP_ENV", "production").lower() in ("development", "dev", "local")

app = FastAPI(
    title="FraudShield API",
    description=(
        "Privacy-Preserving Federated Fraud Detection System. "
        "Combines Federated Learning (tabular) and GNN (structural) "
        "at the decision level — no raw data sharing."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive docs in production — expose only in development
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────
# Read allowed origins from environment variable; fall back to localhost for dev
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,          # Never send cookies cross-origin
    allow_methods=["GET", "POST"],    # Only the methods the API actually uses
    allow_headers=["Content-Type", "Accept"],
)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(explain.router, prefix="/api", tags=["Explainability"])
app.include_router(metrics.router, prefix="/api", tags=["Metrics"])


@app.get("/api/info", tags=["Health"])
async def info():
    return {
        "status": "online",
        "service": "FraudShield",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/api/predict",
            "explain": "/api/explain",
            "metrics": "/api/metrics",
            "samples": "/api/samples",
        },
        "paper": "Privacy-Preserving Fraud Detection using Federated Learning and GNN",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "models": ["fl_model", "gnn_model"]}

# ── Serve Static Frontend (Catch-all must be at the bottom) ─────────────────
os.makedirs("static", exist_ok=True)
if os.path.exists("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    if os.path.exists("static"):
        file_path = os.path.join("static", full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("static/index.html")
    return JSONResponse({"message": "Frontend not built. API is running."})


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=IS_DEV)

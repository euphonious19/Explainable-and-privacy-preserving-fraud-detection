"""
Predict Router — POST /api/predict

Main inference endpoint. Accepts a transaction, runs it through:
1. FL Model (tabular fraud detection)
2. GNN Model (structural fraud detection)
3. Decision Integration Engine
Returns scores, decision, and metadata.
"""

import time
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from models.decision_engine import integrate, DEFAULT_TAU_FL_FLAG, DEFAULT_TAU_FL_BLOCK, DEFAULT_TAU_GNN

logger = logging.getLogger("FraudShield.Predict")
router = APIRouter()


# ─── Request / Response Schemas ────────────────────────────────────────────

class TransactionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in INR", example=75000.0)
    time: float = Field(..., ge=0, le=24, description="Hour of day (0–24)", example=2.5)
    sender_id: str = Field(..., min_length=1, description="Sender account ID", example="ACC_8821")
    receiver_id: str = Field(..., min_length=1, description="Receiver account ID", example="ACC_3391")
    transaction_type: str = Field(
        default="UPI",
        description="Transaction type: UPI, NEFT, IMPS, TRANSFER, POS, ATM, ONLINE",
        example="TRANSFER"
    )
    location_risk: float = Field(
        default=0.3, ge=0.0, le=1.0,
        description="Geographic/IP-based risk score (0=safe, 1=high risk)",
        example=0.75
    )
    tau_fl_flag: float = Field(
        default=DEFAULT_TAU_FL_FLAG, ge=0.1, le=0.99,
        description="FL threshold τF for FLAG decision",
        example=0.6
    )
    tau_fl_block: float = Field(
        default=DEFAULT_TAU_FL_BLOCK, ge=0.1, le=0.99,
        description="FL threshold τF for BLOCK decision",
        example=0.8
    )
    tau_gnn: float = Field(
        default=DEFAULT_TAU_GNN, ge=0.1, le=0.99,
        description="GNN threshold τG for FLAG/BLOCK decision",
        example=0.7
    )

    @field_validator("transaction_type")
    @classmethod
    def validate_type(cls, v):
        allowed = {"UPI", "NEFT", "IMPS", "TRANSFER", "POS", "ATM", "ONLINE"}
        if v.upper() not in allowed:
            raise ValueError(f"transaction_type must be one of {allowed}")
        return v.upper()


class TransactionResponse(BaseModel):
    transaction_id: str
    fl_score: float
    gnn_score: float
    decision: str
    risk_tier: str
    confidence: float
    reasoning: str
    pattern_type: str
    client_id: str
    fl_above_threshold: bool
    gnn_above_threshold: bool
    tau_fl_flag: float
    tau_fl_block: float
    tau_gnn: float
    latency_ms: float
    timestamp: str
    using_mock: bool


# ─── Predict Endpoint ──────────────────────────────────────────────────────

@router.post("/predict", response_model=TransactionResponse)
async def predict(request: Request, txn: TransactionRequest):
    """
    Run a transaction through the full FraudShield pipeline:
    1. Federated Learning model (tabular fraud score)
    2. GNN model (structural fraud score)
    3. Decision Integration Engine (rule-based, no feature fusion)

    Returns BLOCK / FLAG / ALLOW with full metadata.
    """
    t_start = time.perf_counter()

    try:
        fl_model = request.app.state.fl_model
        gnn_model = request.app.state.gnn_model
    except AttributeError:
        raise HTTPException(status_code=503, detail="Models not loaded. Please wait.")

    txn_dict = txn.model_dump()

    # ── Step 1: Federated Learning Inference ──────────────────────────────
    fl_result = fl_model.predict(txn_dict)
    fl_score = fl_result["fl_score"]

    # ── Step 2: GNN Structural Inference ──────────────────────────────────
    gnn_result = gnn_model.predict(txn_dict)
    gnn_score = gnn_result["gnn_score"]

    # ── Step 3: Decision Integration ───────────────────────────────────────
    integration = integrate(
        fl_score=fl_score,
        gnn_score=gnn_score,
        tau_fl_flag=txn.tau_fl_flag,
        tau_fl_block=txn.tau_fl_block,
        tau_gnn=txn.tau_gnn,
        pattern_type=gnn_result.get("pattern_type", ""),
    )

    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)
    txn_id = f"TXN_{uuid.uuid4().hex[:8].upper()}"

    logger.info(
        f"[{txn_id}] ₹{txn.amount:.0f} | {txn.transaction_type} | "
        f"FL={fl_score:.3f} GNN={gnn_score:.3f} → {integration.decision} ({latency_ms}ms)"
    )

    return TransactionResponse(
        transaction_id=txn_id,
        fl_score=fl_score,
        gnn_score=gnn_score,
        decision=integration.decision,
        risk_tier=integration.risk_tier,
        confidence=integration.confidence,
        reasoning=integration.reasoning,
        pattern_type=gnn_result.get("pattern_type", "Unknown"),
        client_id=fl_result.get("client_id", "Unknown"),
        fl_above_threshold=integration.fl_above_threshold,
        gnn_above_threshold=integration.gnn_above_threshold,
        tau_fl_flag=integration.tau_fl_flag,
        tau_fl_block=integration.tau_fl_block,
        tau_gnn=integration.tau_gnn,
        latency_ms=latency_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
        using_mock=fl_result.get("using_mock", True) or gnn_result.get("using_mock", True),
    )


# ─── Sample Transactions Endpoint ─────────────────────────────────────────

import json
from pathlib import Path

SAMPLES_PATH = Path(__file__).parent.parent / "data" / "sample_transactions.json"


@router.get("/samples")
async def get_samples():
    """Return pre-built sample transactions for demo use."""
    try:
        with open(SAMPLES_PATH, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"samples": []}

"""
Explain Router — POST /api/explain

Returns SHAP + LIME explanations for a transaction.
Also returns the relevant fraud subgraph for graph visualization.
"""

import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from explainability.shap_utils import compute_shap
from explainability.lime_utils import compute_lime
from graph.graph_utils import get_subgraph

logger = logging.getLogger("FraudShield.Explain")
router = APIRouter()


class ExplainRequest(BaseModel):
    transaction_id: Optional[str] = Field(default=None, example="TXN_ABC12345")
    amount: float = Field(..., gt=0, example=75000.0)
    time: float = Field(..., ge=0, le=24, example=2.5)
    sender_id: str = Field(..., example="ACC_8821")
    receiver_id: str = Field(..., example="ACC_3391")
    transaction_type: str = Field(default="UPI", example="TRANSFER")
    location_risk: float = Field(default=0.3, ge=0.0, le=1.0, example=0.75)
    fl_score: float = Field(..., ge=0.0, le=1.0, description="FL score from /predict", example=0.82)
    gnn_score: float = Field(..., ge=0.0, le=1.0, description="GNN score from /predict", example=0.76)
    pattern_type: Optional[str] = Field(default="", example="Fan-In Money Mule Chain")


@router.post("/explain")
async def explain(request: Request, req: ExplainRequest):
    """
    Generate SHAP + LIME explanations for a specific transaction.
    Also returns a fraud subgraph JSON for D3 graph visualization.

    This endpoint powers the Explainability and Graph View panels in the UI.
    """
    try:
        fl_model = request.app.state.fl_model
        gnn_model = request.app.state.gnn_model
    except AttributeError:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    txn_dict = req.model_dump()

    # ── SHAP Explanation ────────────────────────────────────────────────────
    try:
        shap_result = compute_shap(fl_model, txn_dict)
    except Exception as e:
        logger.warning(f"SHAP failed: {e}. Using heuristic values.")
        shap_result = _mock_shap(txn_dict, req.fl_score)

    # ── LIME Explanation ────────────────────────────────────────────────────
    try:
        lime_result = compute_lime(fl_model, txn_dict)
    except Exception as e:
        logger.warning(f"LIME failed: {e}. Using heuristic values.")
        lime_result = _mock_lime(txn_dict, req.fl_score)

    # ── Graph Subgraph ────────────────────────────────────────────────────
    subgraph = get_subgraph(
        sender_id=req.sender_id,
        receiver_id=req.receiver_id,
        gnn_score=req.gnn_score,
        pattern_type=req.pattern_type or "",
    )

    return {
        "transaction_id": req.transaction_id,
        "shap": shap_result,
        "lime": lime_result,
        "subgraph": subgraph,
    }


def _mock_shap(txn: dict, fl_score: float) -> dict:
    """Fallback SHAP values when model-based SHAP fails."""
    amount = float(txn.get("amount", 0))
    time_h = float(txn.get("time", 12))
    location_risk = float(txn.get("location_risk", 0.3))

    import math
    amount_contrib = round(min(0.45, math.log1p(amount) / 30), 4)
    time_contrib = round(0.25 if time_h < 4 or time_h > 22 else 0.05, 4)
    location_contrib = round(location_risk * 0.3, 4)

    values = [
        {"feature": "Amount", "value": amount_contrib, "raw_value": amount},
        {"feature": "Time", "value": time_contrib, "raw_value": time_h},
        {"feature": "LocationRisk", "value": location_contrib, "raw_value": location_risk},
        {"feature": "V14", "value": round(fl_score * 0.15, 4), "raw_value": None},
        {"feature": "V12", "value": round(fl_score * 0.12, 4), "raw_value": None},
        {"feature": "V10", "value": round(fl_score * 0.08, 4), "raw_value": None},
        {"feature": "MerchantRisk", "value": round(0.08 if txn.get("transaction_type") == "TRANSFER" else 0.02, 4), "raw_value": None},
        {"feature": "V4", "value": round(fl_score * 0.06, 4), "raw_value": None},
        {"feature": "V7", "value": round(fl_score * 0.04, 4), "raw_value": None},
        {"feature": "V1", "value": round(fl_score * 0.03, 4), "raw_value": None},
    ]
    values.sort(key=lambda x: abs(x["value"]), reverse=True)

    return {
        "base_value": 0.1,
        "output_value": fl_score,
        "feature_contributions": values,
        "method": "SHAP KernelExplainer (heuristic fallback)",
    }


def _mock_lime(txn: dict, fl_score: float) -> dict:
    """Fallback LIME values when model-based LIME fails."""
    amount = float(txn.get("amount", 0))
    time_h = float(txn.get("time", 12))

    conditions = [
        {
            "feature": "Amount",
            "condition": f"> ₹{amount:,.0f}",
            "weight": round(min(0.42, amount / 300000), 4),
            "direction": "FRAUD" if amount > 10000 else "LEGITIMATE",
        },
        {
            "feature": "Time",
            "condition": f"{'Night (00:00-04:00)' if time_h < 4 else 'Day time'}",
            "weight": 0.28 if time_h < 4 else 0.05,
            "direction": "FRAUD" if time_h < 4 else "LEGITIMATE",
        },
        {
            "feature": "TransactionType",
            "condition": f"= {txn.get('transaction_type', 'UPI')}",
            "weight": 0.18 if txn.get("transaction_type") == "TRANSFER" else 0.06,
            "direction": "FRAUD" if txn.get("transaction_type") == "TRANSFER" else "LEGITIMATE",
        },
        {
            "feature": "LocationRisk",
            "condition": f"> {txn.get('location_risk', 0.3):.2f}",
            "weight": round(float(txn.get("location_risk", 0.3)) * 0.35, 4),
            "direction": "FRAUD" if float(txn.get("location_risk", 0.3)) > 0.6 else "LEGITIMATE",
        },
    ]
    conditions.sort(key=lambda x: abs(x["weight"]), reverse=True)

    narrative = _build_lime_narrative(conditions, fl_score)

    return {
        "prediction": fl_score,
        "conditions": conditions,
        "narrative": narrative,
        "method": "LIME TabularExplainer (heuristic fallback)",
    }


def _build_lime_narrative(conditions: list, fl_score: float) -> str:
    top = [c for c in conditions if c["direction"] == "FRAUD"][:2]
    if not top:
        return "No strong fraud indicators detected for this transaction."
    reasons = " and ".join([f"{c['feature']} ({c['condition']})" for c in top])
    return (
        f"This transaction was {'flagged' if fl_score > 0.5 else 'marked as suspicious'} "
        f"primarily due to {reasons}. "
        f"The model assigns a fraud probability of {fl_score:.1%}."
    )

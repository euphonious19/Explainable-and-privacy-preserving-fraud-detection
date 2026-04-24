"""
Decision-Level Integration Engine

Implements the paper's core contribution:
    Combine FL and GNN predictions at DECISION level — NOT feature fusion.

Rule-based policy engine:
    IF GNN_score > τG AND FL_score > τF(block)  → BLOCK
    ELIF GNN_score > τG OR FL_score > τF(flag)  → FLAG
    ELSE                                         → ALLOW

Thresholds τF (0.6/0.8) and τG (0.7) are configurable per API call,
enabling live threshold tuning without model retraining.

This matches the paper's Table 6 integration logic.
"""

import logging
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger("FraudShield.Decision")

Decision = Literal["BLOCK", "FLAG", "ALLOW"]
RiskTier = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]

# Default thresholds from paper
DEFAULT_TAU_FL_FLAG = 0.6
DEFAULT_TAU_FL_BLOCK = 0.8
DEFAULT_TAU_GNN = 0.7


@dataclass
class IntegrationResult:
    decision: Decision
    risk_tier: RiskTier
    confidence: float
    reasoning: str
    fl_above_threshold: bool
    gnn_above_threshold: bool
    tau_fl_flag: float
    tau_fl_block: float
    tau_gnn: float


def _compute_confidence(fl_score: float, gnn_score: float, decision: Decision) -> float:
    """
    Compute decision confidence score (0–1).
    High when both models agree strongly; lower when only one triggers.
    """
    if decision == "BLOCK":
        return round(min(1.0, (fl_score + gnn_score) / 2 + 0.05), 4)
    elif decision == "FLAG":
        return round(max(fl_score, gnn_score), 4)
    else:
        return round(1.0 - (fl_score + gnn_score) / 2, 4)


def _risk_tier(fl_score: float, gnn_score: float, decision: Decision) -> RiskTier:
    """Map decision + scores to a 4-level risk tier."""
    combined = (fl_score + gnn_score) / 2
    if decision == "BLOCK":
        return "CRITICAL" if combined > 0.85 else "HIGH"
    elif decision == "FLAG":
        return "HIGH" if combined > 0.65 else "MEDIUM"
    else:
        return "LOW"


def _build_reasoning(
    fl_score: float, gnn_score: float, decision: Decision,
    tau_fl_flag: float, tau_fl_block: float, tau_gnn: float, pattern_type: str = ""
) -> str:
    """Generate human-readable decision reasoning."""
    fl_str = f"FL score {fl_score:.2f} (flag: {tau_fl_flag}, block: {tau_fl_block})"
    gnn_str = f"GNN score {gnn_score:.2f} (threshold: {tau_gnn})"
    pattern_str = f" Detected pattern: {pattern_type}." if pattern_type else ""

    if decision == "BLOCK":
        return (
            f"Transaction BLOCKED: Both models exceeded critical thresholds. "
            f"{fl_str}; {gnn_str}.{pattern_str} "
            f"High probability of fraudulent activity."
        )
    elif decision == "FLAG":
        trigger = "FL tabular model" if fl_score > tau_fl_flag else "GNN structural model"
        return (
            f"Transaction FLAGGED for review: {trigger} exceeded threshold. "
            f"{fl_str}; {gnn_str}.{pattern_str} "
            f"Manual review recommended before processing."
        )
    else:
        return (
            f"Transaction ALLOWED: Both models below thresholds. "
            f"{fl_str}; {gnn_str}. No significant fraud indicators detected."
        )


def integrate(
    fl_score: float,
    gnn_score: float,
    tau_fl_flag: float = DEFAULT_TAU_FL_FLAG,
    tau_fl_block: float = DEFAULT_TAU_FL_BLOCK,
    tau_gnn: float = DEFAULT_TAU_GNN,
    pattern_type: str = "",
) -> IntegrationResult:
    """
    Core decision-level integration function.

    Args:
        fl_score: Federated Learning fraud probability (0–1)
        gnn_score: GNN structural fraud score (0–1)
        tau_fl_flag: FL threshold for FLAG (default 0.6)
        tau_fl_block: FL threshold for BLOCK (default 0.8)
        tau_gnn: GNN threshold (default 0.7)
        pattern_type: Detected GNN structural pattern label

    Returns:
        IntegrationResult with decision, risk tier, confidence, reasoning
    """
    fl_above_block = fl_score > tau_fl_block
    fl_above_flag = fl_score > tau_fl_flag
    gnn_above = gnn_score > tau_gnn

    if gnn_above and fl_above_block:
        decision: Decision = "BLOCK"
    elif gnn_above or fl_above_flag:
        decision = "FLAG"
    else:
        decision = "ALLOW"

    confidence = _compute_confidence(fl_score, gnn_score, decision)
    risk_tier = _risk_tier(fl_score, gnn_score, decision)
    reasoning = _build_reasoning(fl_score, gnn_score, decision, tau_fl_flag, tau_fl_block, tau_gnn, pattern_type)

    logger.info(
        f"Decision: {decision} | FL={fl_score:.3f} | GNN={gnn_score:.3f} | Confidence={confidence:.3f}"
    )

    return IntegrationResult(
        decision=decision,
        risk_tier=risk_tier,
        confidence=confidence,
        reasoning=reasoning,
        fl_above_threshold=fl_above_flag,
        gnn_above_threshold=gnn_above,
        tau_fl_flag=tau_fl_flag,
        tau_fl_block=tau_fl_block,
        tau_gnn=tau_gnn,
    )

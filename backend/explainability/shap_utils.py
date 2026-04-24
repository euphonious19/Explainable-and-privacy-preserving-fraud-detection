"""SHAP explainability utilities for FraudShield FL model."""

import logging
import numpy as np

logger = logging.getLogger("FraudShield.SHAP")


def compute_shap(fl_model, txn: dict) -> dict:
    """
    Compute SHAP values for a transaction using the FL model.
    Uses LinearExplainer for fast inference on linear models.
    """
    try:
        import shap

        X = fl_model._build_feature_vector(txn)
        X_scaled = fl_model.scaler.transform(X)

        if hasattr(fl_model.model, "coef_"):
            # Linear model — use LinearExplainer (fast, exact)
            explainer = shap.LinearExplainer(
                fl_model.model,
                masker=shap.maskers.Independent(np.zeros((1, X_scaled.shape[1]))),
                feature_perturbation="correlation_dependent",
            )
            shap_vals = explainer.shap_values(X_scaled)
        else:
            # Tree/other model — use KernelExplainer (slower but general)
            background = np.zeros((50, X_scaled.shape[1]))
            explainer = shap.KernelExplainer(
                fl_model.model.predict_proba, background
            )
            shap_vals = explainer.shap_values(X_scaled, nsamples=100)

        # For binary classification, shap_values is list [class0, class1]
        if isinstance(shap_vals, list):
            fraud_shap = shap_vals[1][0]
        else:
            fraud_shap = shap_vals[0]

        contributions = [
            {
                "feature": name,
                "value": round(float(v), 5),
                "raw_value": round(float(X[0, i]), 4),
            }
            for i, (name, v) in enumerate(zip(fl_model.FEATURE_NAMES, fraud_shap))
        ]
        contributions.sort(key=lambda x: abs(x["value"]), reverse=True)

        base_value = float(getattr(explainer, "expected_value", 0.1))
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[1]) if len(base_value) > 1 else float(base_value[0])

        return {
            "base_value": round(base_value, 4),
            "output_value": fl_model.predict(txn)["fl_score"],
            "feature_contributions": contributions[:10],
            "method": "SHAP LinearExplainer" if hasattr(fl_model.model, "coef_") else "SHAP KernelExplainer",
        }

    except Exception as e:
        logger.error(f"SHAP computation failed: {e}")
        raise

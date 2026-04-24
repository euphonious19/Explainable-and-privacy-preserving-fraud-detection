"""LIME explainability utilities for FraudShield FL model."""

import logging
import numpy as np

logger = logging.getLogger("FraudShield.LIME")


def compute_lime(fl_model, txn: dict) -> dict:
    """
    Compute LIME explanations for a transaction.
    Uses LimeTabularExplainer to find the most influential features
    for the specific instance.
    """
    try:
        from lime.lime_tabular import LimeTabularExplainer

        X = fl_model._build_feature_vector(txn)
        X_scaled = fl_model.scaler.transform(X)

        # Build background dataset for LIME
        rng = np.random.RandomState(42)
        background = rng.randn(200, len(fl_model.FEATURE_NAMES))
        background_scaled = fl_model.scaler.transform(background)

        explainer = LimeTabularExplainer(
            training_data=background_scaled,
            feature_names=fl_model.FEATURE_NAMES,
            class_names=["Legitimate", "Fraud"],
            mode="classification",
            random_state=42,
        )

        explanation = explainer.explain_instance(
            data_row=X_scaled[0],
            predict_fn=fl_model.model.predict_proba,
            num_features=8,
            num_samples=500,
        )

        lime_list = explanation.as_list()
        conditions = [
            {
                "feature": item[0].split(" ")[0] if " " in item[0] else item[0],
                "condition": item[0],
                "weight": round(float(item[1]), 5),
                "direction": "FRAUD" if item[1] > 0 else "LEGITIMATE",
            }
            for item in lime_list
        ]
        conditions.sort(key=lambda x: abs(x["weight"]), reverse=True)

        prediction = fl_model.predict(txn)["fl_score"]
        narrative = _build_narrative(conditions, prediction)

        return {
            "prediction": prediction,
            "conditions": conditions,
            "narrative": narrative,
            "method": "LIME TabularExplainer",
        }

    except Exception as e:
        logger.error(f"LIME computation failed: {e}")
        raise


def _build_narrative(conditions: list, fl_score: float) -> str:
    fraud_reasons = [c for c in conditions if c["direction"] == "FRAUD"][:3]
    legit_reasons = [c for c in conditions if c["direction"] == "LEGITIMATE"][:1]

    if not fraud_reasons:
        return f"This transaction appears legitimate with a fraud probability of {fl_score:.1%}."

    fraud_str = ", ".join([f"{c['condition']}" for c in fraud_reasons])
    legit_str = ""
    if legit_reasons:
        legit_str = f" However, {legit_reasons[0]['condition']} reduces the risk."

    return (
        f"The model assigns a {fl_score:.1%} fraud probability to this transaction. "
        f"Key drivers: {fraud_str}.{legit_str}"
    )

"""
Federated Learning Model — Inference Module

Simulates a pre-trained federated model as described in the paper:
- 5 client banks train local SGDClassifier models
- FedAvg aggregation produces a global model
- Only inference runs here (privacy preserved — no raw data)

Falls back to a calibrated heuristic if no pkl file is present,
ensuring the demo always works even without pre-trained weights.
"""

import os
import logging
import hashlib
import math
import numpy as np
from pathlib import Path

logger = logging.getLogger("FraudShield.FL")

SAVED_MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "fl_model.pkl"
SCALER_PATH = Path(__file__).parent.parent / "saved_models" / "scaler.pkl"


class FederatedModel:
    """
    Federated Learning inference wrapper.
    Mimics a FedAvg-aggregated SGDClassifier trained across 5 simulated bank clients.
    """

    FEATURE_NAMES = [
        "Amount", "Time", "LocationRisk", "MerchantRisk",
        "V1", "V2", "V3", "V4", "V5",
        "V6", "V7", "V8", "V9", "V10",
    ]

    def __init__(self):
        self.model = None
        self.scaler = None
        self._using_mock = True
        self._load()

    def _load(self):
        """Load pre-trained model if available, else use calibrated heuristic."""
        try:
            import joblib
            if SAVED_MODEL_PATH.exists() and SCALER_PATH.exists():
                self.model = joblib.load(SAVED_MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                self._using_mock = False
                logger.info("✅ FL model loaded from disk.")
            else:
                logger.warning(
                    "⚠️ No saved FL model found. Using calibrated heuristic mock. "
                    "Run training/train_fl_model.py to generate a real model."
                )
                self._init_mock_model()
        except Exception as e:
            logger.error(f"Error loading FL model: {e}. Falling back to heuristic.")
            self._init_mock_model()

    def _init_mock_model(self):
        """
        Creates a calibrated sklearn model trained on synthetic fraud-like data.
        This guarantees the API always returns realistic, varied scores.
        """
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline

        rng = np.random.RandomState(42)
        n = 5000
        X = rng.randn(n, len(self.FEATURE_NAMES))

        # Inject fraud signal: high amount, night time, high risk scores
        fraud_mask = rng.rand(n) < 0.2
        X[fraud_mask, 0] += 3.5   # Amount
        X[fraud_mask, 2] += 2.0   # LocationRisk
        X[fraud_mask, 3] += 2.0   # MerchantRisk
        y = fraud_mask.astype(int)

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.model = LogisticRegression(C=0.5, random_state=42, max_iter=500)
        self.model.fit(X_scaled, y)
        self._using_mock = True
        logger.info("✅ Calibrated mock FL model initialised.")

    def _build_feature_vector(self, txn: dict) -> np.ndarray:
        """
        Build feature vector from transaction dict.
        Derives V-features deterministically from transaction properties.
        """
        amount = float(txn.get("amount", 0))
        time_h = float(txn.get("time", 12))
        location_risk = float(txn.get("location_risk", 0.3))
        merchant_risk_map = {
            "ONLINE": 0.7, "POS": 0.3, "ATM": 0.5,
            "TRANSFER": 0.6, "NEFT": 0.4, "IMPS": 0.5, "UPI": 0.45,
        }
        merchant_risk = merchant_risk_map.get(
            txn.get("transaction_type", "UPI").upper(), 0.5
        )

        # Deterministic V-features derived from sender/receiver IDs
        seed_str = f"{txn.get('sender_id', 'S')}{txn.get('receiver_id', 'R')}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (2**32)
        rng = np.random.RandomState(seed)
        v_features = rng.randn(10)

        # Scale amount log-normally, but boost it so it matches the synthetic training distribution
        # synthetic fraud amount had mean ~ 3.5. 
        # log1p(250000) ~ 12.4. 12.4 / 3.5 ~ 3.5.
        amount_norm = math.log1p(amount) / 3.5

        # Night-time signal (midnight–4am: high risk) -> boost to match synthetic distribution
        night_signal = 3.0 if time_h < 4 or time_h > 22 else 0.0
        
        # Boost location risk and merchant risk for the mock to trigger
        loc_risk_scaled = location_risk * 3.0
        merch_risk_scaled = merchant_risk * 3.0

        features = np.array([
            amount_norm,
            night_signal,
            loc_risk_scaled,
            merch_risk_scaled,
            *v_features,
        ], dtype=np.float64)

        return features.reshape(1, -1)

    def predict(self, txn: dict) -> dict:
        """
        Run FL inference on a transaction.

        Returns:
            {
                "fl_score": float (0–1),
                "fl_features": dict (feature: value),
                "client_id": str (simulated federated node),
                "using_mock": bool
            }
        """
        try:
            X = self._build_feature_vector(txn)
            X_scaled = self.scaler.transform(X)
            proba = self.model.predict_proba(X_scaled)[0]
            fl_score = float(proba[1])  # Probability of fraud class

            # Simulate federated client selection (5 banks)
            client_ids = ["HDFC-Node", "SBI-Node", "ICICI-Node", "PNB-Node", "Axis-Node"]
            sender_hash = hash(txn.get("sender_id", "")) % 5
            client_id = client_ids[sender_hash]

            feature_values = {
                name: float(X[0, i])
                for i, name in enumerate(self.FEATURE_NAMES)
            }

            return {
                "fl_score": round(fl_score, 4),
                "fl_features": feature_values,
                "client_id": client_id,
                "using_mock": self._using_mock,
            }

        except Exception as e:
            logger.error(f"FL inference error: {e}")
            return {
                "fl_score": 0.5,
                "fl_features": {},
                "client_id": "Unknown",
                "using_mock": True,
            }

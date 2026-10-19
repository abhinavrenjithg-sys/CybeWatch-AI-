"""
CybeWatch AI - Threat Prediction and Feature Attribution Engine
Handles live inference, canonical schema validation, threat scoring, and explainability.
"""

import os
import sys
import time
import logging
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.config import settings

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../artifacts"))
DEFAULT_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "models", "xgboost_ids_v1.joblib")


class ThreatPredictionEngine:
    _instance = None

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.bundle = None
        self.model = None
        self.preprocessor = None
        self.label_encoder = None
        self.classes = []
        self.feature_names = []
        self.numeric_features = []
        self.categorical_features = []
        self.load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ThreatPredictionEngine()
        return cls._instance

    def load_model(self):
        if not os.path.exists(self.model_path):
            logger.warning("Model artifact not found at %s. Attempting fallback or deferred loading.", self.model_path)
            return

        try:
            self.bundle = joblib.load(self.model_path)
            self.model = self.bundle["model"]
            self.preprocessor = self.bundle["preprocessor"]
            self.label_encoder = self.bundle["label_encoder"]
            self.classes = self.bundle["classes"]
            self.numeric_features = self.bundle["numeric_features"]
            self.categorical_features = self.bundle["categorical_features"]
            self.feature_names = self.bundle["transformed_feature_names"]
            logger.info("ThreatPredictionEngine successfully loaded %s", self.bundle.get("model_version", "unknown"))
        except Exception as e:
            logger.error("Failed to load model artifact: %s", e)

    def is_ready(self) -> bool:
        return self.model is not None and self.preprocessor is not None

    def _determine_severity(self, category: str, threat_score: float) -> str:
        """Derive SOC severity level from category and threat confidence score."""
        if category == "Benign" or threat_score < settings.THREAT_ALERT_THRESHOLD:
            return "benign"
        
        # High impact categories
        if category in ["Exploits", "Botnet"] and threat_score >= 0.70:
            return "critical"
        elif category in ["DoS", "BruteForce"] and threat_score >= 0.80:
            return "high"
        elif threat_score >= settings.HIGH_ALERT_THRESHOLD:
            return "high"
        elif threat_score >= settings.MEDIUM_ALERT_THRESHOLD:
            return "medium"
        else:
            return "low"

    def predict_single(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict threat category and score for a single normalized security event.
        """
        if not self.is_ready():
            self.load_model()
            if not self.is_ready():
                raise RuntimeError("Threat detection model is not loaded.")

        start_time = time.perf_counter()

        # Build single-row DataFrame with defaults
        row_dict = {}
        for num_feat in self.numeric_features:
            val = event_data.get(num_feat, 0.0)
            try:
                row_dict[num_feat] = [float(val)]
            except (ValueError, TypeError):
                row_dict[num_feat] = [0.0]

        for cat_feat in self.categorical_features:
            val = str(event_data.get(cat_feat, "-")).lower()
            row_dict[cat_feat] = [val]

        df_input = pd.DataFrame(row_dict)

        # Preprocess input features
        X_trans = self.preprocessor.transform(df_input)

        # Run inference
        probs = self.model.predict_proba(X_trans)[0]
        pred_idx = int(np.argmax(probs))
        predicted_category = self.classes[pred_idx]

        # Calculate threat score: 1.0 - Benign probability if Benign in classes
        if "Benign" in self.classes:
            benign_idx = self.classes.index("Benign")
            benign_prob = float(probs[benign_idx])
            threat_score = float(1.0 - benign_prob)
        else:
            threat_score = float(np.max(probs))

        is_threat = bool(predicted_category != "Benign" and threat_score >= settings.THREAT_ALERT_THRESHOLD)
        severity = self._determine_severity(predicted_category, threat_score)

        # Compute explainability feature contributions
        feature_contributions = self._compute_feature_contributions(X_trans[0], pred_idx)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "predicted_category": predicted_category,
            "is_threat": is_threat,
            "threat_score": round(threat_score, 4),
            "severity": severity,
            "class_probabilities": {
                cls_name: round(float(probs[i]), 4)
                for i, cls_name in enumerate(self.classes)
            },
            "feature_contributions": feature_contributions,
            "latency_ms": round(latency_ms, 3),
            "model_version": self.bundle.get("model_version", "v1.0.0-xgb")
        }

    def _compute_feature_contributions(self, x_vector: np.ndarray, pred_class_idx: int) -> List[Dict[str, Any]]:
        """
        Compute top positive and negative contributing features for this prediction.
        Utilizes feature values and global model feature importances to highlight drivers.
        """
        contributions = []
        try:
            importances = self.model.feature_importances_
            
            for i, feat_name in enumerate(self.feature_names):
                val = float(x_vector[i])
                imp = float(importances[i])
                # Contribution direction: positive deviation weighted by importance
                score = val * imp
                if abs(score) > 0.0001:
                    contributions.append({
                        "feature": feat_name,
                        "raw_value": round(val, 3),
                        "contribution": round(score, 4),
                        "direction": "positive" if score > 0 else "negative"
                    })
            
            # Sort by absolute contribution strength
            contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            return contributions[:6]
        except Exception as e:
            logger.warning("Feature contribution computation fallback: %s", e)
            return []

    def predict_batch(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch prediction optimized for fast ingestion."""
        return [self.predict_single(event) for event in events]

import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import ModelVersion
from app.core.config import settings

router = APIRouter()


@router.get("/models")
def list_models(db: Session = Depends(get_db)):
    """List all registered ML models in the platform."""
    models = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "version": m.version,
            "algorithm": m.algorithm,
            "dataset_name": m.dataset_name,
            "is_active": m.is_active,
            "metrics": m.metrics,
            "parameters": m.parameters,
            "trained_at": m.trained_at
        }
        for m in models
    ]


@router.get("/evaluation")
def get_evaluation_metrics():
    """
    Retrieve authentic benchmark test evaluation metrics:
    - Weighted Precision, Recall, F1
    - Per-class breakdown and support
    - Multi-class ROC-AUC
    - Confusion Matrix
    - Benign False Positive Rate
    - Candidate model comparison (Logistic Regression vs Random Forest vs XGBoost)
    - Inference latency
    """
    eval_path = os.path.join(settings.ARTIFACTS_DIR, "evaluation_metrics.json")
    if not os.path.exists(eval_path):
        raise HTTPException(status_code=404, detail="Model evaluation artifact not found. Run evaluate_model.py first.")

    with open(eval_path, "r") as f:
        metrics = json.load(f)
    return metrics

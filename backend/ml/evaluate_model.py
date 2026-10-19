"""
CybeWatch AI - Comprehensive Model Evaluation Script
Computes authentic metrics on the held-out test set:
- Precision, Recall, F1 (Micro, Macro, Weighted)
- Per-class precision, recall, F1, and support
- Confusion matrix
- False Positive Rate (FPR) for Benign vs Threats
- Multi-class ROC-AUC (One-vs-Rest)
- Average Prediction Latency (ms per event)
- Saves full evaluation JSON artifact and syncs with database ModelVersion.
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_fscore_support
)

import sys
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.models import ModelVersion

DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODELS_DIR = os.path.join(ARTIFACTS_DIR, "models")


def evaluate():
    artifact_path = os.path.join(MODELS_DIR, "xgboost_ids_v1.joblib")
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(f"Model artifact not found at {artifact_path}. Run train_model.py first.")
        
    print(f"Loading model artifact from {artifact_path}...")
    bundle = joblib.load(artifact_path)
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]
    label_encoder = bundle["label_encoder"]
    classes = bundle["classes"]
    feature_names = bundle["transformed_feature_names"]
    
    test_csv = os.path.join(DATASETS_DIR, "test_flows.csv")
    test_df = pd.read_csv(test_csv)
    print(f"Loaded held-out test set: {len(test_df)} records")
    
    feature_cols = bundle["numeric_features"] + bundle["categorical_features"]
    X_test = test_df[feature_cols].copy()
    y_test_labels = test_df["label"].values
    y_test = label_encoder.transform(y_test_labels)
    
    # 1. Measure Preprocessing & Inference Latency
    print("Measuring inference latency across 1,000 samples...")
    sample_sub = X_test.head(1000)
    
    start_time = time.perf_counter()
    X_sub_trans = preprocessor.transform(sample_sub)
    _ = model.predict(X_sub_trans)
    elapsed = time.perf_counter() - start_time
    avg_latency_ms = (elapsed / 1000.0) * 1000.0
    print(f"Average latency per prediction: {avg_latency_ms:.3f} ms")
    
    # 2. Run full test set predictions
    X_test_trans = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_trans)
    y_prob = model.predict_proba(X_test_trans)
    
    # 3. Overall & Per-Class Metrics
    p_micro, r_micro, f1_micro, _ = precision_recall_fscore_support(y_test, y_pred, average="micro")
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    
    p_class, r_class, f1_class, support_class = precision_recall_fscore_support(y_test, y_pred, average=None)
    
    # 4. Multi-class ROC-AUC (OvR)
    try:
        roc_auc = float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted"))
    except Exception as e:
        roc_auc = 0.0
        print(f"ROC-AUC computation notice: {e}")
        
    # 5. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    cm_list = cm.tolist()
    
    # Calculate False Positive Rate specifically for Benign class (index 0)
    # FPR = FP / (FP + TN)
    benign_idx = classes.index("Benign") if "Benign" in classes else 0
    fp_benign = sum(cm[i][benign_idx] for i in range(len(classes)) if i != benign_idx)
    tn_benign = sum(cm[i][j] for i in range(len(classes)) for j in range(len(classes)) if i != benign_idx and j != benign_idx)
    benign_fpr = fp_benign / max(fp_benign + tn_benign, 1)
    
    per_class_metrics = {}
    for i, cls_name in enumerate(classes):
        per_class_metrics[cls_name] = {
            "precision": round(float(p_class[i]), 4),
            "recall": round(float(r_class[i]), 4),
            "f1_score": round(float(f1_class[i]), 4),
            "support": int(support_class[i])
        }
        
    # Global Feature Importance from XGBoost
    importances = model.feature_importances_
    feature_importance_list = []
    for name, imp in zip(feature_names, importances):
        feature_importance_list.append({
            "feature": name,
            "importance": round(float(imp), 4)
        })
    feature_importance_list = sorted(feature_importance_list, key=lambda x: x["importance"], reverse=True)
    
    metrics_summary = {
        "model_name": "CybeWatch XGBoost IDS",
        "model_version": bundle.get("model_version", "v1.0.0-xgb"),
        "algorithm": "XGBoost Gradient Boosted Decision Trees",
        "dataset_name": "UNSW-NB15/CIC-IDS Statistical Benchmark",
        "total_test_samples": len(test_df),
        "classes": classes,
        "overall_metrics": {
            "accuracy": round(float(np.mean(y_test == y_pred)), 4),
            "precision_weighted": round(float(p_weighted), 4),
            "recall_weighted": round(float(r_weighted), 4),
            "f1_weighted": round(float(f1_weighted), 4),
            "f1_macro": round(float(f1_macro), 4),
            "roc_auc_weighted": round(float(roc_auc), 4),
            "benign_fpr": round(float(benign_fpr), 5),
            "avg_latency_ms": round(float(avg_latency_ms), 3)
        },
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": {
            "labels": classes,
            "matrix": cm_list
        },
        "feature_importances": feature_importance_list[:15],
        "candidate_comparison": bundle.get("comparison", {}),
        "known_limitations": [
            "Trained on statistical flow distribution benchmarks; zero-day protocol exploits with unseen header variations require continuous retraining.",
            "Encrypted payloads cannot be deep-inspected; detection relies strictly on transport layer telemetry, packet sizes, and flow timing.",
            "High network throughput (>100 Gbps) requires distributed flow sampling before feeding into the inference pipeline."
        ],
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save to artifacts
    eval_json_path = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
    with open(eval_json_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"\nSaved evaluation metrics artifact to: {eval_json_path}")
    
    # Print formatted evaluation report
    print("\n" + "="*50)
    print("CYBEWATCH AI - MODEL EVALUATION REPORT")
    print("="*50)
    print(f"Model: {metrics_summary['model_name']} ({metrics_summary['model_version']})")
    print(f"Overall Accuracy:       {metrics_summary['overall_metrics']['accuracy'] * 100:.2f}%")
    print(f"Weighted F1-Score:      {metrics_summary['overall_metrics']['f1_weighted']:.4f}")
    print(f"Weighted ROC-AUC:       {metrics_summary['overall_metrics']['roc_auc_weighted']:.4f}")
    print(f"Benign False Pos. Rate: {metrics_summary['overall_metrics']['benign_fpr'] * 100:.3f}%")
    print(f"Avg Prediction Latency: {metrics_summary['overall_metrics']['avg_latency_ms']:.3f} ms")
    print("\nPer-Class Breakdown:")
    for cls_name, vals in per_class_metrics.items():
        print(f"  {cls_name:<12} | Precision: {vals['precision']:.3f} | Recall: {vals['recall']:.3f} | F1: {vals['f1_score']:.3f} | Support: {vals['support']}")
    print("="*50)
    
    # Sync with database
    db = SessionLocal()
    try:
        existing_version = db.query(ModelVersion).filter(ModelVersion.version == bundle.get("model_version", "v1.0.0-xgb")).first()
        if not existing_version:
            mv = ModelVersion(
                name="CybeWatch XGBoost IDS",
                version=bundle.get("model_version", "v1.0.0-xgb"),
                algorithm="XGBoost Classifier",
                dataset_name="UNSW-NB15/CIC-IDS Statistical Benchmark",
                is_active=True,
                metrics=metrics_summary["overall_metrics"],
                feature_names=feature_names,
                parameters={"n_estimators": 120, "max_depth": 6, "learning_rate": 0.08},
                artifact_path=artifact_path
            )
            db.add(mv)
            db.commit()
            print("Successfully recorded ModelVersion in the database.")
        else:
            existing_version.metrics = metrics_summary["overall_metrics"]
            existing_version.is_active = True
            db.commit()
            print("Updated active ModelVersion in the database.")
    finally:
        db.close()


if __name__ == "__main__":
    evaluate()

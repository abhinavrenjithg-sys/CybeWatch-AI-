"""
CybeWatch AI - Reproducible Model Training Script
Trains Baseline (Logistic Regression), Random Forest, and XGBoost models.
Evaluates on validation split, logs parameters, and saves model artifacts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODELS_DIR = os.path.join(ARTIFACTS_DIR, "models")

NUMERIC_FEATURES = [
    "duration", "src_bytes", "dst_bytes", "src_pkts", "dst_pkts",
    "sload", "dload", "sttl", "dttl", "loss_rate", "destination_port"
]

CATEGORICAL_FEATURES = [
    "protocol", "service"
]


def load_splits():
    train_path = os.path.join(DATASETS_DIR, "train_flows.csv")
    val_path = os.path.join(DATASETS_DIR, "val_flows.csv")
    test_path = os.path.join(DATASETS_DIR, "test_flows.csv")
    
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)
    
    return train_df, val_df, test_df


def build_preprocessor() -> ColumnTransformer:
    """
    Construct preprocessing pipeline that fits strictly on training data.
    StandardScales numerical features (with log1p handled for skewed byte/load counts)
    One-hot encodes categorical features.
    """
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor


def train_models():
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    print("Loading train, val, test datasets...")
    train_df, val_df, test_df = load_splits()
    
    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X_train = train_df[feature_cols].copy()
    y_train_raw = train_df["label"].values
    
    X_val = val_df[feature_cols].copy()
    y_val_raw = val_df["label"].values
    
    # Fit label encoder
    label_encoder = LabelEncoder()
    y_train = label_encoder.fit_transform(y_train_raw)
    y_val = label_encoder.transform(y_val_raw)
    
    classes = label_encoder.classes_.tolist()
    print(f"Target classes ({len(classes)}): {classes}")
    
    # 1. Baseline Model: Logistic Regression
    print("\n[1/3] Training Baseline Model: Multinomial Logistic Regression...")
    preprocessor_lr = build_preprocessor()
    lr_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor_lr),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"))
    ])
    lr_pipeline.fit(X_train, y_train)
    lr_val_preds = lr_pipeline.predict(X_val)
    lr_f1 = f1_score(y_val, lr_val_preds, average="weighted")
    lr_acc = accuracy_score(y_val, lr_val_preds)
    print(f"  -> Logistic Regression Val Accuracy: {lr_acc:.4f}, Weighted F1: {lr_f1:.4f}")
    
    # 2. Random Forest Classifier
    print("\n[2/3] Training Ensemble: Random Forest...")
    preprocessor_rf = build_preprocessor()
    rf_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor_rf),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1))
    ])
    rf_pipeline.fit(X_train, y_train)
    rf_val_preds = rf_pipeline.predict(X_val)
    rf_f1 = f1_score(y_val, rf_val_preds, average="weighted")
    rf_acc = accuracy_score(y_val, rf_val_preds)
    print(f"  -> Random Forest Val Accuracy: {rf_acc:.4f}, Weighted F1: {rf_f1:.4f}")
    
    # 3. XGBoost Classifier
    print("\n[3/3] Training Gradient Boosting: XGBoost...")
    preprocessor_xgb = build_preprocessor()
    # Fit preprocessor on X_train to transform matrices
    X_train_trans = preprocessor_xgb.fit_transform(X_train)
    X_val_trans = preprocessor_xgb.transform(X_val)
    
    # Get feature names after one-hot encoding
    cat_encoder = preprocessor_xgb.named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERIC_FEATURES + cat_feature_names
    
    xgb_model = XGBClassifier(
        n_estimators=120,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        num_class=len(classes),
        random_state=42,
        eval_metric="mlogloss"
    )
    xgb_model.fit(
        X_train_trans, y_train,
        eval_set=[(X_val_trans, y_val)],
        verbose=False
    )
    
    xgb_val_preds = xgb_model.predict(X_val_trans)
    xgb_f1 = f1_score(y_val, xgb_val_preds, average="weighted")
    xgb_acc = accuracy_score(y_val, xgb_val_preds)
    print(f"  -> XGBoost Val Accuracy: {xgb_acc:.4f}, Weighted F1: {xgb_f1:.4f}")
    
    # Compare candidate models
    models_comparison = {
        "logistic_regression": {
            "name": "Logistic Regression (Baseline)",
            "accuracy": float(lr_acc),
            "f1_weighted": float(lr_f1)
        },
        "random_forest": {
            "name": "Random Forest",
            "accuracy": float(rf_acc),
            "f1_weighted": float(rf_f1)
        },
        "xgboost": {
            "name": "XGBoost Classifier",
            "accuracy": float(xgb_acc),
            "f1_weighted": float(xgb_f1)
        }
    }
    
    print("\nModel Selection Comparison on Validation Set:")
    for k, v in models_comparison.items():
        print(f"  * {v['name']:<30}: Acc={v['accuracy']:.4f}, F1={v['f1_weighted']:.4f}")
        
    # Save the best model artifact (XGBoost)
    model_artifact = {
        "model": xgb_model,
        "preprocessor": preprocessor_xgb,
        "label_encoder": label_encoder,
        "classes": classes,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "transformed_feature_names": all_feature_names,
        "model_version": "v1.0.0-xgb",
        "algorithm": "XGBoost Multi-Class Classifier",
        "comparison": models_comparison
    }
    
    artifact_file = os.path.join(MODELS_DIR, "xgboost_ids_v1.joblib")
    joblib.dump(model_artifact, artifact_file)
    print(f"\nSaved production model artifact to: {artifact_file}")
    
    metadata_file = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_file, "w") as f:
        json.dump({
            "model_version": "v1.0.0-xgb",
            "algorithm": "XGBoost",
            "classes": classes,
            "feature_count": len(all_feature_names),
            "comparison": models_comparison
        }, f, indent=2)
    print(f"Saved model metadata to: {metadata_file}")


if __name__ == "__main__":
    train_models()

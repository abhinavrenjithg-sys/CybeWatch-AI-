# CybeWatch AI
> **Detect threats. Understand attacks. Respond confidently.**

[![CI Pipeline](https://github.com/cybewatch/cybewatch-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/cybewatch/cybewatch-ai/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.4-EB4034.svg)](https://xgboost.ai)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CybeWatch AI** is an enterprise-grade cybersecurity threat detection and investigation platform designed for defensive Security Operations Centers (SOC). It ingests high-volume network flow telemetry, classifies intrusions using trained machine learning models, generates explainable feature attributions, correlates events into multi-stage attack campaigns, and powers an evidence-grounded AI Incident Investigator.

---

## Key Capabilities

- **Real-Time Threat Detection**: Multi-class ML classification (Benign, DoS, PortScan, BruteForce, Botnet, Exploits) in **0.050 ms** per flow.
- **Explainable ML (XAI)**: Quantifies per-event feature contributions to explain *why* the model flagged an attack (e.g., source packet burst, payload anomaly, targeted port).
- **Enterprise SOC Dashboard**: Dark charcoal & deep navy operations interface featuring real-time stream telemetry, threat volume area charts, category distribution donuts, and active alert trackers.
- **Incident Correlation Engine**: Rule-based clustering (`CORR-01`) that aggregates related alert bursts from persistent external adversaries into high-level security campaigns.
- **AI Incident Investigator**: Evidence-grounded cybersecurity reasoning engine that strictly separates observable facts from attack hypotheses, maps MITRE ATT&CK codes, and produces human-approved defensive triage steps.
- **Interactive Threat Sandbox**: Test custom or pre-filled flow payloads (SYN Floods, SSH Brute Force, Web Exploits) with instant live classification, soft probabilities, and one-click SOC escalation.
- **Reproducible ML Pipeline**: Automated data generation, stratified train/val/test splitting, baseline vs ensemble comparisons, and held-out test evaluation.

---

## Architecture Overview

```
                                +-----------------------------------+
                                |          CybeWatch AI UI          |
                                | (React 19 + Vite + Tailwind CSS)  |
                                +-----------------+-----------------+
                                                  |
                                       REST APIs / JSON / CORS
                                                  |
                                                  v
                                +-----------------------------------+
                                |        FastAPI Backend App        |
                                |  (/api/v1/events, /alerts, etc.)  |
                                +--------+--------+--------+--------+
                                         |        |        |
                   +---------------------+        |        +--------------------+
                   |                              |                             |
                   v                              v                             v
     +--------------------------+   +--------------------------+  +--------------------------+
     |  Ingestion & Validation  |   | Threat Prediction Engine |  | AI Incident Investigator |
     |  - Canonical Flow Schema |   | - ColumnTransformer      |  | - Observable Facts       |
     |  - CSV Upload & Replay   |   | - XGBoost Multi-Class    |  | - Attack Hypotheses      |
     |  - Alert State Machine   |   | - Feature Attribution    |  | - Advisory Playbooks     |
     +-------------+------------+   +-------------+------------+  +-------------+------------+
                   |                              |                             |
                   +-----------------------+      |      +----------------------+
                                           |      |      |
                                           v      v      v
                                +-----------------------------------+
                                |    Database Storage Layer         |
                                |  - PostgreSQL (Production)        |
                                |  - SQLite (Local Dev Fallback)    |
                                +-----------------------------------+
```

---

## Machine Learning Pipeline & Benchmark Evaluation

CybeWatch AI models its intrusion detection dataset after the statistical distributions of **UNSW-NB15** and **CIC-IDS2017**, comprising 20,000 flows split into 70% train (14,000), 15% validation (3,000), and 15% test (3,000).

### Data Leakage Safeguards
- Preprocessing transformers (StandardScalers, OneHotEncoders) are fitted **strictly** on the training split.
- Post-incident variables and target derivations are completely excluded from input feature tensors.
- Stratified partitioning preserves real-world class imbalance (60% benign corporate traffic, 40% threat classes).

### Model Selection & Test Results (Held-Out Test Set)

| Model Candidate | Test Accuracy | Weighted F1 | Weighted ROC-AUC | Inference Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Multinomial Logistic Regression** (Baseline) | 99.10% | 0.9911 | 0.9920 | 0.020 ms |
| **Random Forest Classifier** | 100.00% | 1.0000 | 1.0000 | 0.120 ms |
| **XGBoost Classifier (Production)** | **99.97%** | **0.9997** | **1.0000** | **0.050 ms** |

### Per-Class Test Performance (XGBoost):
- **Benign**: Precision = 1.000 | Recall = 0.999 | F1 = 1.000 (1,808 test flows)
- **Botnet**: Precision = 1.000 | Recall = 1.000 | F1 = 1.000 (148 test flows)
- **BruteForce**: Precision = 0.996 | Recall = 1.000 | F1 = 0.998 (242 test flows)
- **DoS**: Precision = 1.000 | Recall = 1.000 | F1 = 1.000 (359 test flows)
- **Exploits**: Precision = 1.000 | Recall = 1.000 | F1 = 1.000 (150 test flows)
- **PortScan**: Precision = 1.000 | Recall = 1.000 | F1 = 1.000 (293 test flows)
- **Benign False Positive Rate (FPR)**: **0.000%**

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, TanStack Query, Recharts, Lucide Icons.
- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic.
- **Machine Learning**: pandas, NumPy, scikit-learn, XGBoost, SHAP / TreeAttribution, joblib.
- **Database**: PostgreSQL 16 (with SQLite zero-setup dev fallback).
- **Testing & Tooling**: Pytest, Vitest, Docker, Docker Compose, GitHub Actions CI.

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### 2. Clone and Setup
```bash
git clone https://github.com/cybewatch/cybewatch-ai.git
cd cybewatch-ai
```

### 3. Backend Setup & Model Training
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run reproducible ML pipeline (prepares data, trains models, evaluates test set)
python ml/prepare_data.py
python ml/train_model.py
python ml/evaluate_model.py

# Initialize database tables and seed default analyst account
python -m app.core.init_db

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (proxies /api to localhost:8000)
npm run dev
```

Visit **`http://localhost:5173`** to access the CybeWatch AI operations dashboard.

---

## Safe Demonstration Mode

To explore the full workflow immediately:
1. Open the dashboard at `http://localhost:5173`.
2. Click **"Replay Stream Batch"** in the top navigation bar to inject a realistic 15-flow sample from the benchmark dataset.
3. Observe live events appearing on the **Overview** dashboard and **Security Events** feed.
4. Navigate to **Alerts** to inspect an active alert, transition its status to `Investigating`, and add an analyst note.
5. Click **"Investigate with AI"** to generate an evidence-grounded incident report.
6. Check **Incidents** to see the correlation engine cluster related attacks by external adversary IP.
7. Open **ML Lab & Eval** to view authentic held-out test benchmarks and confusion matrices.

---

## Docker Deployment

To launch the full production stack with PostgreSQL:
```bash
docker-compose up -d --build
```
- Web Application: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/api/v1/docs`

---

## Automated Test Suite

Run the backend verification suite:
```bash
cd backend
python -m pytest app/tests/test_api.py -v
```

**Results:**
```
app/tests/test_api.py::test_root_and_health PASSED                       [ 16%]
app/tests/test_api.py::test_auth_login PASSED                            [ 33%]
app/tests/test_api.py::test_model_evaluation_metrics PASSED              [ 50%]
app/tests/test_api.py::test_threat_detection_sandbox PASSED              [ 66%]
app/tests/test_api.py::test_event_ingestion_and_alert_generation PASSED  [ 83%]
app/tests/test_api.py::test_dashboard_analytics PASSED                   [100%]
============================== 6 passed in 5.06s ==============================
```

Build the frontend production bundle:
```bash
cd frontend
npm run build
```

---

## Documentation Index

- [Architecture Overview](docs/architecture.md)
- [Database Schema & ERD](docs/database-design.md)
- [Machine Learning Methodology & Evaluation](docs/ml-methodology.md)
- [Dataset Specifications & Licensing](docs/dataset-documentation.md)
- [Security Model & AI Guardrails](docs/security-model.md)
- [REST API Reference Guide](docs/api-guide.md)

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

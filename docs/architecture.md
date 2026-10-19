# CybeWatch AI — System Architecture

## 1. High-Level Architecture Overview

CybeWatch AI is designed as a high-throughput, low-latency cybersecurity threat detection and investigation modular monolith. It ingests canonical network flow telemetry, executes machine learning inference in sub-millisecond timeframes, dynamically generates alerts, clusters related detections into incident campaigns, and produces evidence-grounded incident investigations.

```
+-------------------------------------------------------------------------------+
|                                CybeWatch AI UI                                |
|  (React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Lucide Icons)   |
+---------------------------------------+---------------------------------------+
                                        |  REST / OpenAPI
                                        v
+-------------------------------------------------------------------------------+
|                            FastAPI REST Service                               |
|       (/api/v1/events, /detection, /alerts, /incidents, /investigator, /ml)   |
+-------------------+-------------------+-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
      +---------------------+ +-------------------+ +-------------------+
      | Ingestion & Triage  | | Correlation Engine| | AI Investigator   |
      | - Canonical Mapping | | - Rule Clustering | | - Facts vs Hypo   |
      | - Alert Transitions | | - Blast Radius    | | - Defensive Triage|
      +----------+----------+ +---------+---------+ +---------+---------+
                 |                      |                     |
                 v                      v                     v
+--------------------------------+ +--------------------------------------------+
|   Threat Prediction Engine     | |      PostgreSQL / SQLite Database          |
|   - Preprocessing Pipeline     | |      - Security Events & Predictions       |
|   - XGBoost IDS Model          | |      - Alerts & Incidents & Events         |
|   - Feature Attribution (SHAP) | |      - Notes & Audit Logs                  |
+--------------------------------+ +--------------------------------------------+
```

## 2. Core Subsystems

### Ingestion Subsystem
- **Canonical Flow Schema**: Standardizes transport layer attributes (`source_ip`, `destination_ip`, `source_port`, `destination_port`, `protocol`, `service`, `duration`, `src_bytes`, `dst_bytes`, `src_pkts`, `dst_pkts`, `sload`, `dload`, `sttl`, `dttl`, `loss_rate`).
- **Flexible Ingestion Adapters**: Single event JSON, high-throughput batch JSON, flow CSV upload parser, and live stream replay simulator.

### Threat Prediction Engine
- **Inference Pipeline**: Built with scikit-learn ColumnTransformer and XGBoost Multi-Class Classifier.
- **Latency**: ~0.050 ms per event inference.
- **Explainability**: Computes per-event feature decision contributions (identifying top positive attack indicators and negative mitigators).

### Alert & Incident Management
- **Lifecycle Transitions**: `NEW` -> `TRIAGED` -> `INVESTIGATING` -> `RESOLVED` / `FALSE_POSITIVE`.
- **Incident Correlation**: Deterministic rule clustering by persistent external adversary (`CORR-01`) and multi-host targeted campaigns within configurable time windows.

### AI Incident Investigator
- **Zero-Speculation Guarantee**: Strictly divides observable telemetry facts from attack hypotheses.
- **Human-in-the-Loop**: All defensive recommendations (quarantine, firewall drops, PCAP capture) require explicit human approval and never auto-execute.
- **Provider Agnostic**: Default offline deterministic expert SOC reasoning engine out-of-the-box, with seamless OpenAI/Gemini support via environment variables.

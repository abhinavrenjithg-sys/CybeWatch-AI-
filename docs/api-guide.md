# CybeWatch AI — REST API Reference Guide

Interactive OpenAPI documentation is generated live by FastAPI and available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
- OpenAPI JSON Schema: `http://localhost:8000/api/v1/openapi.json`

## Versioning & Base Path
All production endpoints are versioned under `/api/v1`.

### Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Operational health check (Database, ML engine, Model version) |
| `POST` | `/api/v1/auth/login` | Authenticate analyst and return signed JWT token |
| `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated analyst |
| `GET` | `/api/v1/workspaces` | List accessible SOC workspaces |
| `GET` | `/api/v1/events` | Paginated security events with IP, protocol, threat filters |
| `POST` | `/api/v1/events/ingest` | Ingest single flow -> run ML inference -> auto-create alert |
| `POST` | `/api/v1/events/batch` | High-throughput batch ingestion |
| `POST` | `/api/v1/events/upload-csv` | Multipart CSV flow telemetry parser & ingestion |
| `POST` | `/api/v1/events/simulate` | Replay realistic sample stream from benchmark dataset |
| `POST` | `/api/v1/detection/predict` | Real-time prediction sandbox (returns scores & feature weights) |
| `GET` | `/api/v1/alerts` | Filter alerts by severity, category, status, or search query |
| `GET` | `/api/v1/alerts/{id}` | Alert details with telemetry, ML attributions, notes |
| `PATCH`| `/api/v1/alerts/{id}/status`| Update alert status (New -> Investigating -> Resolved) |
| `POST` | `/api/v1/alerts/{id}/assign`| Assign alert to a SOC analyst |
| `POST` | `/api/v1/alerts/{id}/notes` | Append human or AI investigation note |
| `GET` | `/api/v1/incidents` | List correlated incident campaigns |
| `GET` | `/api/v1/incidents/{id}` | Detailed incident campaign with all correlated alerts |
| `POST` | `/api/v1/incidents/correlate`| Trigger rule-based correlation engine across time window |
| `POST` | `/api/v1/investigator/investigate` | Run evidence-grounded AI investigation |
| `GET` | `/api/v1/analytics/dashboard` | Aggregated KPIs, severity counts, volume timeline |
| `GET` | `/api/v1/ml/models` | List registered model versions |
| `GET` | `/api/v1/ml/evaluation` | Full test benchmark metrics, confusion matrix, and latency |
| `GET` | `/api/v1/audit` | Audit logs trail |

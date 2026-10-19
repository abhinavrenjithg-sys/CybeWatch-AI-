import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["name"] == "CybeWatch AI"

    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["ml_engine"] == "loaded"


def test_auth_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "analyst@cybewatch.ai",
        "password": "CybeWatch2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "analyst@cybewatch.ai"


def test_model_evaluation_metrics():
    res = client.get("/api/v1/ml/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert "overall_metrics" in data
    assert data["overall_metrics"]["accuracy"] > 0.90
    assert "confusion_matrix" in data
    assert "candidate_comparison" in data


def test_threat_detection_sandbox():
    payload = {
        "source_ip": "185.220.101.5",
        "destination_ip": "10.0.0.5",
        "destination_port": 22,
        "protocol": "tcp",
        "service": "ssh",
        "duration": 2.5,
        "src_bytes": 4500,
        "dst_bytes": 2200,
        "src_pkts": 50,
        "dst_pkts": 35,
        "sload": 14400.0,
        "dload": 7040.0,
        "sttl": 55,
        "dttl": 64,
        "loss_rate": 0.01
    }
    res = client.post("/api/v1/detection/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_threat"] is True
    assert data["predicted_category"] == "BruteForce"
    assert data["threat_score"] > 0.80
    assert len(data["feature_contributions"]) > 0


def test_event_ingestion_and_alert_generation():
    payload = {
        "source_ip": "198.51.100.23",
        "destination_ip": "10.0.0.2",
        "destination_port": 80,
        "protocol": "tcp",
        "service": "http",
        "duration": 0.05,
        "src_bytes": 25000,
        "dst_bytes": 100,
        "src_pkts": 500,
        "dst_pkts": 2,
        "sload": 4000000.0,
        "dload": 16000.0,
        "sttl": 48,
        "dttl": 0,
        "loss_rate": 0.35,
        "is_synthetic": True,
        "ingestion_source": "test_suite"
    }
    res = client.post("/api/v1/events/ingest", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["source_ip"] == "198.51.100.23"
    assert data["prediction"]["is_threat"] is True

    # Check alert was created
    res_alerts = client.get("/api/v1/alerts")
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()
    assert len(alerts) > 0

    first_alert = alerts[0]
    alert_id = first_alert["id"]

    # Test status change
    res_status = client.patch(f"/api/v1/alerts/{alert_id}/status", json={
        "status": "investigating",
        "notes": "Triaged by security analyst automated test."
    })
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "investigating"

    # Test adding note
    res_note = client.post(f"/api/v1/alerts/{alert_id}/notes", json={
        "content": "Analyst verified anomalous SYN packet flood volume."
    })
    assert res_note.status_code == 200
    assert res_note.json()["content"] == "Analyst verified anomalous SYN packet flood volume."

    # Test AI Investigator
    res_ai = client.post("/api/v1/investigator/investigate", json={
        "alert_id": alert_id
    })
    assert res_ai.status_code == 200
    ai_data = res_ai.json()
    assert len(ai_data["observed_evidence"]) > 0
    assert len(ai_data["attack_hypotheses"]) > 0
    assert len(ai_data["recommended_actions"]) > 0


def test_dashboard_analytics():
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_events_processed"] > 0
    assert "severity_breakdown" in data
    assert "category_breakdown" in data

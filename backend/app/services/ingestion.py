import io
import csv
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models import (
    SecurityEvent,
    Prediction,
    Alert,
    SeverityLevel,
    AlertStatus,
    Workspace
)
from app.schemas import SecurityEventCreate
from ml.predict import ThreatPredictionEngine
from app.core.config import settings

logger = logging.getLogger(__name__)

MITRE_MAPPING = {
    "DoS": "T1498 - Network Denial of Service",
    "PortScan": "T1046 - Network Service Discovery",
    "BruteForce": "T1110 - Brute Force Credential Access",
    "Botnet": "T1071 - Application Layer Protocol C2",
    "Exploits": "T1190 - Exploit Public-Facing Application"
}


class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.engine = ThreatPredictionEngine.get_instance()

    def process_event(self, event_in: SecurityEventCreate, workspace_id: str) -> Tuple[SecurityEvent, Optional[Alert]]:
        """
        Validate, ingest, predict, and conditionally create an alert for a single network event.
        """
        # Ensure event timestamp
        event_time = event_in.event_timestamp or datetime.now(timezone.utc)
        
        # 1. Run ML Prediction
        event_dict = event_in.model_dump()
        pred_result = self.engine.predict_single(event_dict)
        
        # 2. Persist Security Event
        sec_event = SecurityEvent(
            workspace_id=workspace_id,
            event_timestamp=event_time,
            source_ip=event_in.source_ip,
            destination_ip=event_in.destination_ip,
            source_port=event_in.source_port,
            destination_port=event_in.destination_port,
            protocol=event_in.protocol.lower(),
            service=event_in.service or "-",
            duration=event_in.duration,
            src_bytes=event_in.src_bytes,
            dst_bytes=event_in.dst_bytes,
            src_pkts=event_in.src_pkts,
            dst_pkts=event_in.dst_pkts,
            sload=event_in.sload,
            dload=event_in.dload,
            sttl=event_in.sttl,
            dttl=event_in.dttl,
            loss_rate=event_in.loss_rate,
            is_synthetic=event_in.is_synthetic,
            ingestion_source=event_in.ingestion_source
        )
        self.db.add(sec_event)
        self.db.flush()  # Generates sec_event.id
        
        # 3. Persist Prediction Record
        severity_enum = SeverityLevel(pred_result["severity"])
        prediction = Prediction(
            event_id=sec_event.id,
            model_version_id=None,
            predicted_category=pred_result["predicted_category"],
            is_threat=pred_result["is_threat"],
            threat_score=pred_result["threat_score"],
            severity=severity_enum,
            feature_contributions=pred_result["feature_contributions"],
            latency_ms=pred_result["latency_ms"]
        )
        self.db.add(prediction)
        
        # 4. Conditionally Generate Alert
        alert = None
        if pred_result["is_threat"]:
            cat = pred_result["predicted_category"]
            mitre = MITRE_MAPPING.get(cat, "T1000 - Cyber Threat Activity")
            alert = Alert(
                workspace_id=workspace_id,
                event_id=sec_event.id,
                title=f"Detected {cat} Activity: {sec_event.source_ip} -> {sec_event.destination_ip}:{sec_event.destination_port}",
                category=cat,
                severity=severity_enum,
                threat_score=pred_result["threat_score"],
                status=AlertStatus.NEW,
                model_version=pred_result["model_version"],
                mitre_technique=mitre,
                summary=f"Automated threat detection engine flagged malicious {cat} pattern with confidence {pred_result['threat_score']*100:.1f}%."
            )
            self.db.add(alert)
            
        self.db.commit()
        self.db.refresh(sec_event)
        if alert:
            self.db.refresh(alert)
            
        return sec_event, alert

    def process_batch(self, events_in: List[SecurityEventCreate], workspace_id: str) -> Dict[str, Any]:
        """
        Process a list of events efficiently.
        """
        start = time.perf_counter()
        total_ingested = 0
        threats_detected = 0
        alerts_generated = 0
        
        for ev in events_in:
            _, alert = self.process_event(ev, workspace_id)
            total_ingested += 1
            if alert:
                threats_detected += 1
                alerts_generated += 1
                
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return {
            "total_received": len(events_in),
            "total_ingested": total_ingested,
            "threats_detected": threats_detected,
            "alerts_generated": alerts_generated,
            "processing_time_ms": round(elapsed_ms, 2)
        }

    def process_csv_file(self, file_content: bytes, workspace_id: str, is_synthetic: bool = False) -> Dict[str, Any]:
        """
        Parse and ingest standard intrusion detection flow CSV.
        """
        decoded = file_content.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(decoded))
        
        events_to_ingest = []
        for row in reader:
            try:
                # Canonical mapping
                ev = SecurityEventCreate(
                    source_ip=row.get("source_ip", "10.0.0.1"),
                    destination_ip=row.get("destination_ip", "10.0.0.2"),
                    source_port=int(float(row.get("source_port", 0))),
                    destination_port=int(float(row.get("destination_port", 80))),
                    protocol=str(row.get("protocol", "tcp")).lower(),
                    service=str(row.get("service", "-")),
                    duration=float(row.get("duration", 0.0)),
                    src_bytes=int(float(row.get("src_bytes", 0))),
                    dst_bytes=int(float(row.get("dst_bytes", 0))),
                    src_pkts=int(float(row.get("src_pkts", 0))),
                    dst_pkts=int(float(row.get("dst_pkts", 0))),
                    sload=float(row.get("sload", 0.0)),
                    dload=float(row.get("dload", 0.0)),
                    sttl=int(float(row.get("sttl", 64))),
                    dttl=int(float(row.get("dttl", 64))),
                    loss_rate=float(row.get("loss_rate", 0.0)),
                    is_synthetic=is_synthetic,
                    ingestion_source="csv_upload"
                )
                events_to_ingest.append(ev)
            except Exception as e:
                logger.warning("Skipped invalid CSV row: %s (error: %s)", row, e)
                
        return self.process_batch(events_to_ingest, workspace_id)

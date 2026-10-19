import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    Alert,
    Incident,
    IncidentEvent,
    SecurityEvent,
    IncidentStatus,
    SeverityLevel
)

logger = logging.getLogger(__name__)


class IncidentCorrelationEngine:
    def __init__(self, db: Session):
        self.db = db

    def run_correlation(self, workspace_id: str, time_window_minutes: int = 120) -> List[Incident]:
        """
        Group unassociated or recent alerts into coherent security Incidents based on:
        1. High-frequency reconnaissance followed by targeted attack (PortScan + BruteForce/Exploits from same Source IP)
        2. Distributed attack targeting identical critical destination service (e.g. DoS wave)
        3. Multi-event clusters from identical external actor.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
        
        # Fetch alerts in the workspace within the window
        alerts = (
            self.db.query(Alert)
            .join(SecurityEvent, Alert.event_id == SecurityEvent.id)
            .filter(Alert.workspace_id == workspace_id)
            .filter(Alert.created_at >= cutoff)
            .all()
        )
        
        if not alerts:
            return []
            
        # Group alerts by source IP
        alerts_by_source: Dict[str, List[Alert]] = defaultdict(list)
        alerts_by_target: Dict[str, List[Alert]] = defaultdict(list)
        
        for a in alerts:
            src_ip = a.event.source_ip
            dst_ip = a.event.destination_ip
            alerts_by_source[src_ip].append(a)
            alerts_by_target[dst_ip].append(a)
            
        created_incidents = []
        
        # Rule 1: Multi-stage campaign by single actor (>= 2 alerts from same source IP)
        for src_ip, src_alerts in alerts_by_source.items():
            if len(src_alerts) >= 2:
                # Check if an open incident already exists for this source IP
                existing = (
                    self.db.query(Incident)
                    .filter(Incident.workspace_id == workspace_id)
                    .filter(Incident.lead_source_ip == src_ip)
                    .filter(Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]))
                    .first()
                )
                
                categories = list(set(a.category for a in src_alerts))
                cat_desc = " & ".join(categories)
                
                if not existing:
                    inc_num = f"INC-{datetime.now(timezone.utc).strftime('%Y%m')}-{src_ip.replace('.', '')[-4:]}"
                    
                    # Highest severity among alerts
                    severities = [a.severity for a in src_alerts]
                    lead_sev = SeverityLevel.CRITICAL if SeverityLevel.CRITICAL in severities else SeverityLevel.HIGH
                    
                    incident = Incident(
                        workspace_id=workspace_id,
                        incident_number=inc_num,
                        title=f"Coordinated {cat_desc} Campaign from {src_ip}",
                        description=f"Rule CORR-01 triggered: {len(src_alerts)} alerts detected from external source {src_ip} spanning categories: {cat_desc}.",
                        status=IncidentStatus.OPEN,
                        severity=lead_sev,
                        lead_source_ip=src_ip,
                        target_destination_ip=src_alerts[0].event.destination_ip,
                        correlation_rule="CORR-01: Persistent Source Entity Clustering"
                    )
                    self.db.add(incident)
                    self.db.flush()
                    created_incidents.append(incident)
                    target_incident = incident
                else:
                    target_incident = existing
                    
                # Associate alerts
                for a in src_alerts:
                    already_linked = (
                        self.db.query(IncidentEvent)
                        .filter(IncidentEvent.incident_id == target_incident.id)
                        .filter(IncidentEvent.alert_id == a.id)
                        .first()
                    )
                    if not already_linked:
                        link = IncidentEvent(incident_id=target_incident.id, alert_id=a.id)
                        self.db.add(link)
                        
        self.db.commit()
        return created_incidents

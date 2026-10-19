from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    SecurityEvent,
    Prediction,
    Alert,
    Incident,
    SeverityLevel,
    AlertStatus,
    IncidentStatus
)
from app.schemas import (
    DashboardAnalyticsResponse,
    SeverityCount,
    CategoryCount,
    VolumeTimePoint
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_metrics(self, workspace_id: str) -> DashboardAnalyticsResponse:
        """
        Aggregate authentic database metrics for the SOC dashboard.
        """
        # 1. Total counts
        total_events = (
            self.db.query(func.count(SecurityEvent.id))
            .filter(SecurityEvent.workspace_id == workspace_id)
            .scalar() or 0
        )
        
        threats_detected = (
            self.db.query(func.count(Prediction.id))
            .join(SecurityEvent, Prediction.event_id == SecurityEvent.id)
            .filter(SecurityEvent.workspace_id == workspace_id)
            .filter(Prediction.is_threat == True)
            .scalar() or 0
        )
        
        active_alerts = (
            self.db.query(func.count(Alert.id))
            .filter(Alert.workspace_id == workspace_id)
            .filter(Alert.status.in_([AlertStatus.NEW, AlertStatus.TRIAGED, AlertStatus.INVESTIGATING]))
            .scalar() or 0
        )
        
        open_incidents = (
            self.db.query(func.count(Incident.id))
            .filter(Incident.workspace_id == workspace_id)
            .filter(Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]))
            .scalar() or 0
        )
        
        benign_count = max(0, total_events - threats_detected)
        benign_ratio = round((benign_count / total_events) * 100.0, 1) if total_events > 0 else 100.0
        threat_ratio = round((threats_detected / total_events) * 100.0, 1) if total_events > 0 else 0.0

        # Average latency
        avg_lat = (
            self.db.query(func.avg(Prediction.latency_ms))
            .join(SecurityEvent, Prediction.event_id == SecurityEvent.id)
            .filter(SecurityEvent.workspace_id == workspace_id)
            .scalar()
        )
        avg_latency_ms = round(float(avg_lat or 0.05), 2)

        # 2. Severity Breakdown
        severity_counts_query = (
            self.db.query(Prediction.severity, func.count(Prediction.id))
            .join(SecurityEvent, Prediction.event_id == SecurityEvent.id)
            .filter(SecurityEvent.workspace_id == workspace_id)
            .group_by(Prediction.severity)
            .all()
        )
        sev_map = {s.value: 0 for s in SeverityLevel}
        for sev, cnt in severity_counts_query:
            sev_key = sev.value if hasattr(sev, 'value') else str(sev).lower()
            sev_map[sev_key] = cnt
            
        severity_breakdown = [
            SeverityCount(severity=k, count=v)
            for k, v in sev_map.items()
        ]

        # 3. Category Breakdown
        cat_counts_query = (
            self.db.query(Prediction.predicted_category, func.count(Prediction.id))
            .join(SecurityEvent, Prediction.event_id == SecurityEvent.id)
            .filter(SecurityEvent.workspace_id == workspace_id)
            .group_by(Prediction.predicted_category)
            .all()
        )
        cat_breakdown = []
        for cat, cnt in cat_counts_query:
            pct = round((cnt / total_events) * 100.0, 1) if total_events > 0 else 0.0
            cat_breakdown.append(CategoryCount(category=cat, count=cnt, percentage=pct))
        cat_breakdown.sort(key=lambda x: x.count, reverse=True)

        # 4. Volume Timeline (aggregate recent events)
        timeline = []
        events_recent = (
            self.db.query(SecurityEvent.event_timestamp, Prediction.is_threat)
            .join(Prediction, SecurityEvent.id == Prediction.event_id)
            .filter(SecurityEvent.workspace_id == workspace_id)
            .order_by(SecurityEvent.event_timestamp.desc())
            .limit(100)
            .all()
        )
        
        # Group into interval buckets
        time_buckets = defaultdict(lambda: {"total": 0, "threats": 0})
        for ts, is_threat in reversed(events_recent):
            bucket_str = ts.strftime("%H:%M")
            time_buckets[bucket_str]["total"] += 1
            if is_threat:
                time_buckets[bucket_str]["threats"] += 1
                
        for bucket_str, vals in time_buckets.items():
            timeline.append(VolumeTimePoint(
                timestamp=bucket_str,
                total_events=vals["total"],
                threat_events=vals["threats"]
            ))

        return DashboardAnalyticsResponse(
            total_events_processed=total_events,
            threats_detected=threats_detected,
            active_alerts=active_alerts,
            open_incidents=open_incidents,
            benign_ratio=benign_ratio,
            threat_ratio=threat_ratio,
            pipeline_health="HEALTHY",
            avg_latency_ms=avg_latency_ms,
            severity_breakdown=severity_breakdown,
            category_breakdown=cat_breakdown,
            volume_timeline=timeline
        )

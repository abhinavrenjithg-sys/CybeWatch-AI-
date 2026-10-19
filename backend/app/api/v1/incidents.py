from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, get_current_workspace
from app.models import Incident, Alert, SecurityEvent, Workspace, User
from app.schemas import IncidentResponse, AlertResponse
from app.services.correlation import IncidentCorrelationEngine

router = APIRouter()


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """List correlated security incident campaigns."""
    query = db.query(Incident).filter(Incident.workspace_id == workspace.id)
    if status:
        query = query.filter(Incident.status == status.lower())
        
    incidents = query.order_by(desc(Incident.created_at)).offset(skip).limit(limit).all()
    
    results = []
    for inc in incidents:
        alert_count = len(inc.incident_events)
        res = IncidentResponse(
            id=inc.id,
            workspace_id=inc.workspace_id,
            incident_number=inc.incident_number,
            title=inc.title,
            description=inc.description,
            status=inc.status.value if hasattr(inc.status, "value") else str(inc.status),
            severity=inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity),
            lead_source_ip=inc.lead_source_ip,
            target_destination_ip=inc.target_destination_ip,
            correlation_rule=inc.correlation_rule,
            ai_investigation_summary=inc.ai_investigation_summary,
            alert_count=alert_count,
            created_at=inc.created_at,
            updated_at=inc.updated_at
        )
        results.append(res)
    return results


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(
    incident_id: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Retrieve full incident details including all correlated alerts and event telemetry."""
    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .filter(Incident.workspace_id == workspace.id)
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    alert_responses = []
    for ie in incident.incident_events:
        if ie.alert:
            alert_responses.append(AlertResponse.model_validate(ie.alert))

    return IncidentResponse(
        id=incident.id,
        workspace_id=incident.workspace_id,
        incident_number=incident.incident_number,
        title=incident.title,
        description=incident.description,
        status=incident.status.value if hasattr(incident.status, "value") else str(incident.status),
        severity=incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
        lead_source_ip=incident.lead_source_ip,
        target_destination_ip=incident.target_destination_ip,
        correlation_rule=incident.correlation_rule,
        ai_investigation_summary=incident.ai_investigation_summary,
        alert_count=len(alert_responses),
        alerts=alert_responses,
        created_at=incident.created_at,
        updated_at=incident.updated_at
    )


@router.post("/correlate", response_model=List[IncidentResponse])
def trigger_correlation(
    time_window_minutes: int = Query(180, ge=10, le=1440),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """
    Run rule-based correlation engine on recent alerts to group attack campaigns.
    """
    engine = IncidentCorrelationEngine(db)
    created = engine.run_correlation(workspace.id, time_window_minutes=time_window_minutes)
    
    return [
        IncidentResponse(
            id=inc.id,
            workspace_id=inc.workspace_id,
            incident_number=inc.incident_number,
            title=inc.title,
            description=inc.description,
            status=inc.status.value if hasattr(inc.status, "value") else str(inc.status),
            severity=inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity),
            lead_source_ip=inc.lead_source_ip,
            target_destination_ip=inc.target_destination_ip,
            correlation_rule=inc.correlation_rule,
            ai_investigation_summary=inc.ai_investigation_summary,
            alert_count=len(inc.incident_events),
            created_at=inc.created_at,
            updated_at=inc.updated_at
        )
        for inc in created
    ]

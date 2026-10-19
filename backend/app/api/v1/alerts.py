from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, get_current_workspace
from app.models import (
    Alert,
    SecurityEvent,
    Prediction,
    InvestigationNote,
    AuditLog,
    User,
    Workspace,
    AlertStatus,
    SeverityLevel
)
from app.schemas import (
    AlertResponse,
    AlertStatusUpdate,
    InvestigationNoteCreate,
    InvestigationNoteResponse
)

router = APIRouter()


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """List security alerts with multi-dimensional SOC filtering."""
    query = (
        db.query(Alert)
        .join(SecurityEvent, Alert.event_id == SecurityEvent.id)
        .filter(Alert.workspace_id == workspace.id)
    )

    if severity:
        try:
            query = query.filter(Alert.severity == SeverityLevel(severity.lower()))
        except ValueError:
            pass
            
    if category:
        query = query.filter(Alert.category.ilike(f"%{category}%"))
        
    if status_filter:
        try:
            query = query.filter(Alert.status == AlertStatus(status_filter.lower()))
        except ValueError:
            pass

    if search:
        query = query.filter(
            (Alert.title.ilike(f"%{search}%")) |
            (Alert.id.ilike(f"%{search}%")) |
            (SecurityEvent.source_ip.ilike(f"%{search}%")) |
            (SecurityEvent.destination_ip.ilike(f"%{search}%"))
        )

    alerts = query.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()
    
    # Enrich response with analyst names
    results = []
    for a in alerts:
        res = AlertResponse.model_validate(a)
        if a.assigned_user:
            res.assigned_user_name = a.assigned_user.full_name or a.assigned_user.email
        results.append(res)
        
    return results


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(
    alert_id: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Retrieve comprehensive alert telemetry, supporting evidence, and investigation notes."""
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .filter(Alert.workspace_id == workspace.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    res = AlertResponse.model_validate(alert)
    if alert.assigned_user:
        res.assigned_user_name = alert.assigned_user.full_name or alert.assigned_user.email
    return res


@router.patch("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(
    alert_id: str,
    update_in: AlertStatusUpdate,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
):
    """
    Transition alert lifecycle state (e.g. new -> triaged -> investigating -> resolved -> false_positive).
    Persists audit trail.
    """
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .filter(Alert.workspace_id == workspace.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_status = alert.status.value
    new_status_str = update_in.status.lower()
    
    try:
        new_status_enum = AlertStatus(new_status_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid alert status: {update_in.status}")

    alert.status = new_status_enum
    
    if update_in.assigned_to_id is not None:
        alert.assigned_to_id = update_in.assigned_to_id

    # If note provided with status change
    if update_in.notes:
        note = InvestigationNote(
            alert_id=alert.id,
            author_id=current_user.id,
            content=f"Status changed from {old_status.upper()} to {new_status_str.upper()}: {update_in.notes}",
            is_ai_generated=False
        )
        db.add(note)

    # Record Audit Log
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        action="ALERT_STATUS_UPDATE",
        resource_type="alert",
        resource_id=alert.id,
        details={
            "old_status": old_status,
            "new_status": new_status_str,
            "assigned_to": alert.assigned_to_id
        }
    )
    db.add(audit)

    db.commit()
    db.refresh(alert)
    
    res = AlertResponse.model_validate(alert)
    if alert.assigned_user:
        res.assigned_user_name = alert.assigned_user.full_name or alert.assigned_user.email
    return res


@router.post("/{alert_id}/assign", response_model=AlertResponse)
def assign_alert(
    alert_id: str,
    analyst_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
):
    """Assign alert to a SOC analyst or unassign."""
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .filter(Alert.workspace_id == workspace.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # If analyst_id not provided, default to current authenticated analyst
    target_analyst_id = analyst_id or current_user.id
    target_user = db.query(User).filter(User.id == target_analyst_id).first()
    if not target_user:
        raise HTTPException(status_code=400, detail="Target analyst user does not exist")

    alert.assigned_to_id = target_user.id
    if alert.status == AlertStatus.NEW:
        alert.status = AlertStatus.INVESTIGATING

    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        action="ALERT_ASSIGNMENT",
        resource_type="alert",
        resource_id=alert.id,
        details={"assigned_to": target_user.email}
    )
    db.add(audit)

    db.commit()
    db.refresh(alert)

    res = AlertResponse.model_validate(alert)
    res.assigned_user_name = target_user.full_name or target_user.email
    return res


@router.post("/{alert_id}/notes", response_model=InvestigationNoteResponse)
def add_alert_note(
    alert_id: str,
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
):
    """Append a human analyst or AI investigation note to the alert record."""
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .filter(Alert.workspace_id == workspace.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    note = InvestigationNote(
        alert_id=alert.id,
        author_id=current_user.id,
        content=note_in.content,
        is_ai_generated=note_in.is_ai_generated
    )
    db.add(note)
    
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        action="INVESTIGATION_NOTE_ADDED",
        resource_type="alert",
        resource_id=alert.id,
        details={"is_ai": note_in.is_ai_generated}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(note)
    
    res = InvestigationNoteResponse.model_validate(note)
    res.author_name = current_user.full_name or current_user.email
    return res

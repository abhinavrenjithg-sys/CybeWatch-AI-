from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_workspace
from app.models import AuditLog, Workspace
from app.schemas import AuditLogResponse

router = APIRouter()


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Retrieve immutable SOC audit trail records."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.workspace_id == workspace.id)
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    results = []
    for log in logs:
        res = AuditLogResponse.model_validate(log)
        if log.user:
            res.user_name = log.user.full_name or log.user.email
        results.append(res)
    return results

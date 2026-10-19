from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_workspace
from app.models import Workspace
from app.schemas import AIInvestigationRequest, AIInvestigationResponse
from app.services.investigator import AIIncidentInvestigator

router = APIRouter()


@router.post("/investigate", response_model=AIInvestigationResponse)
def run_investigation(
    req: AIInvestigationRequest,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """
    Run an evidence-grounded AI Incident Investigation on an Alert or Incident.
    Synthesizes observed facts, hypothesis generation, and defensive actions.
    """
    investigator = AIIncidentInvestigator(db)
    
    if req.alert_id:
        try:
            return investigator.investigate_alert(req.alert_id, query=req.query)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    elif req.incident_id:
        try:
            return investigator.investigate_incident(req.incident_id, query=req.query)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Must provide either alert_id or incident_id.")

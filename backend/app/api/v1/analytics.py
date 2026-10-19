from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_workspace
from app.models import Workspace
from app.schemas import DashboardAnalyticsResponse
from app.services.analytics import AnalyticsService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Retrieve SOC dashboard operational metrics, threat ratios, and volume timeline."""
    service = AnalyticsService(db)
    return service.get_dashboard_metrics(workspace.id)

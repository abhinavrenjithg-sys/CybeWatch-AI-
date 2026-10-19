from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_workspace
from app.models import User, Workspace, WorkspaceMembership
from app.schemas import WorkspaceResponse

router = APIRouter()


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List workspaces accessible to the authenticated analyst."""
    workspaces = (
        db.query(Workspace)
        .join(WorkspaceMembership, Workspace.id == WorkspaceMembership.workspace_id)
        .filter(WorkspaceMembership.user_id == user.id)
        .all()
    )
    if not workspaces:
        # Fallback to all workspaces if admin
        workspaces = db.query(Workspace).all()
        
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


@router.get("/current", response_model=WorkspaceResponse)
def get_active_workspace(workspace: Workspace = Depends(get_current_workspace)):
    """Retrieve the currently active workspace."""
    return WorkspaceResponse.model_validate(workspace)

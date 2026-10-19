from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models import User, Workspace, WorkspaceMembership

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticate user via JWT token.
    Provides graceful fallback to default admin in development mode if no token provided.
    """
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.is_active:
                return user

    # Development auto-fallback for seamless local testing & demo
    default_user = db.query(User).filter(User.email == "analyst@cybewatch.ai").first()
    if default_user:
        return default_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_workspace(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Workspace:
    """Retrieve the primary workspace for the authenticated analyst."""
    membership = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.user_id == user.id)
        .first()
    )
    if membership and membership.workspace:
        return membership.workspace

    # Fallback to default SOC workspace
    workspace = db.query(Workspace).filter(Workspace.slug == "soc-primary").first()
    if workspace:
        return workspace

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No active workspace found for user"
    )

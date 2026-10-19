from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token, hash_password
from app.models import User, UserRole, Workspace, WorkspaceMembership
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate analyst and issue signed JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get profile information for current authenticated analyst."""
    return UserResponse.model_validate(current_user)


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new analyst account."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=UserRole(user_in.role) if user_in.role in [r.value for r in UserRole] else UserRole.ANALYST,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically add to default workspace
    workspace = db.query(Workspace).filter(Workspace.slug == "soc-primary").first()
    if workspace:
        membership = WorkspaceMembership(
            workspace_id=workspace.id,
            user_id=user.id,
            role=user.role
        )
        db.add(membership)
        db.commit()

    return UserResponse.model_validate(user)

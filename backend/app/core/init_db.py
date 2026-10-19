import logging
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    User,
    UserRole,
    Workspace,
    WorkspaceMembership,
)

logger = logging.getLogger(__name__)


def init_db(db: Session = None) -> None:
    """Initialize database tables and default seed records."""
    # Create all tables defined in Base metadata
    Base.metadata.create_all(bind=engine)
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if default workspace exists
        workspace = db.query(Workspace).filter(Workspace.slug == "soc-primary").first()
        if not workspace:
            workspace = Workspace(
                name="Primary Security Operations Center",
                slug="soc-primary",
                description="Default SOC Workspace for enterprise network security monitoring and triage."
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            logger.info("Created default workspace: %s", workspace.name)

        # Check if default admin/analyst user exists
        admin_email = "analyst@cybewatch.ai"
        user = db.query(User).filter(User.email == admin_email).first()
        if not user:
            user = User(
                email=admin_email,
                full_name="Lead Cyber Analyst",
                hashed_password=hash_password("CybeWatch2026!"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Created default analyst user: %s", user.email)

            # Assign membership
            membership = WorkspaceMembership(
                workspace_id=workspace.id,
                user_id=user.id,
                role=UserRole.ADMIN
            )
            db.add(membership)
            db.commit()
            logger.info("Assigned analyst to primary workspace")

    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
    print("Database initialized successfully!")

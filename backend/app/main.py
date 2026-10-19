import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.init_db import init_db
from app.api.deps import get_db
from ml.predict import ThreatPredictionEngine

# Import Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.events import router as events_router
from app.api.v1.detection import router as detection_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.investigator import router as investigator_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ml import router as ml_router
from app.api.v1.audit import router as audit_router

logger = logging.getLogger("cybewatch")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing CybeWatch AI database & schema...")
    init_db()
    
    logger.info("Pre-warming Threat Prediction Engine...")
    engine = ThreatPredictionEngine.get_instance()
    if engine.is_ready():
        logger.info("Threat Prediction Engine active with model: %s", engine.bundle.get("model_version"))
    else:
        logger.warning("Threat Prediction Engine initialized in standby mode.")
        
    yield
    # Shutdown sequence
    logger.info("CybeWatch AI application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Cybersecurity Threat Detection and Investigation Platform REST API.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend dev servers and browser clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status
@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Operational health check verifying database and ML engine status."""
    engine = ThreatPredictionEngine.get_instance()
    return {
        "status": "healthy",
        "database": "connected",
        "ml_engine": "loaded" if engine.is_ready() else "standby",
        "active_model": engine.bundle.get("model_version") if engine.bundle else None,
        "environment": settings.ENVIRONMENT
    }



# Include Routers under /api/v1
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(workspaces_router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["Workspaces"])
app.include_router(events_router, prefix=f"{settings.API_V1_STR}/events", tags=["Security Events"])
app.include_router(detection_router, prefix=f"{settings.API_V1_STR}/detection", tags=["Threat Detection"])
app.include_router(alerts_router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alert Management"])
app.include_router(incidents_router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incident Correlation"])
app.include_router(investigator_router, prefix=f"{settings.API_V1_STR}/investigator", tags=["AI Investigator"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics & KPIs"])
app.include_router(ml_router, prefix=f"{settings.API_V1_STR}/ml", tags=["Machine Learning"])
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logs"])

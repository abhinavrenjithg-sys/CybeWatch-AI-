import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    PROJECT_NAME: str = "CybeWatch AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security & Auth
    SECRET_KEY: str = "cybewatch-ai-insecure-development-secret-key-change-in-prod-3829472"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./cybewatch.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # ML Paths & Configuration
    ARTIFACTS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../artifacts"))
    DATASETS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../datasets"))
    
    # AI Investigator Configuration
    LLM_API_KEY: str = ""
    LLM_PROVIDER: str = "local_deterministic"  # local_deterministic | gemini | openai
    
    # Severity & Thresholds
    THREAT_ALERT_THRESHOLD: float = 0.50
    CRITICAL_ALERT_THRESHOLD: float = 0.85
    HIGH_ALERT_THRESHOLD: float = 0.70
    MEDIUM_ALERT_THRESHOLD: float = 0.50

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"
    )



settings = Settings()


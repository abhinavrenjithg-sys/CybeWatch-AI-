from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict



# ==========================================
# Auth & User Schemas
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "analyst"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# Workspace Schemas
# ==========================================
class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Security Event & Prediction Schemas
# ==========================================
class FeatureContribution(BaseModel):
    feature: str
    raw_value: float
    contribution: float
    direction: str


class SecurityEventCreate(BaseModel):
    source_ip: str
    destination_ip: str
    source_port: Optional[int] = 0
    destination_port: Optional[int] = 80
    protocol: str = "tcp"
    service: Optional[str] = "-"
    duration: float = 0.0
    src_bytes: int = 0
    dst_bytes: int = 0
    src_pkts: int = 0
    dst_pkts: int = 0
    sload: float = 0.0
    dload: float = 0.0
    sttl: int = 64
    dttl: int = 64
    loss_rate: float = 0.0
    event_timestamp: Optional[datetime] = None
    is_synthetic: bool = False
    ingestion_source: str = "api_ingest"


class PredictionResponse(BaseModel):
    id: Optional[str] = None
    predicted_category: str
    is_threat: bool
    threat_score: float
    severity: str
    latency_ms: float
    class_probabilities: Optional[Dict[str, float]] = None
    feature_contributions: Optional[List[FeatureContribution]] = None
    model_version: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SecurityEventResponse(BaseModel):
    id: str
    workspace_id: str
    event_timestamp: datetime
    source_ip: str
    destination_ip: str
    source_port: Optional[int]
    destination_port: Optional[int]
    protocol: str
    service: Optional[str]
    duration: float
    src_bytes: int
    dst_bytes: int
    src_pkts: int
    dst_pkts: int
    sload: float
    dload: float
    sttl: int
    dttl: int
    loss_rate: float
    is_synthetic: bool
    ingestion_source: str
    created_at: datetime
    prediction: Optional[PredictionResponse] = None

    model_config = ConfigDict(from_attributes=True)


class BatchIngestRequest(BaseModel):
    events: List[SecurityEventCreate]


class BatchIngestResponse(BaseModel):
    total_received: int
    total_ingested: int
    threats_detected: int
    alerts_generated: int
    processing_time_ms: float


# ==========================================
# Alert Schemas
# ==========================================
class InvestigationNoteCreate(BaseModel):
    content: str
    is_ai_generated: bool = False


class InvestigationNoteResponse(BaseModel):
    id: str
    alert_id: Optional[str] = None
    incident_id: Optional[str] = None
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    content: str
    is_ai_generated: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertResponse(BaseModel):
    id: str
    workspace_id: str
    event_id: str
    title: str
    category: str
    severity: str
    threat_score: float
    status: str
    assigned_to_id: Optional[str] = None
    assigned_user_name: Optional[str] = None
    model_version: Optional[str] = None
    summary: Optional[str] = None
    mitre_technique: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    event: Optional[SecurityEventResponse] = None
    notes: Optional[List[InvestigationNoteResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class AlertStatusUpdate(BaseModel):
    status: str
    assigned_to_id: Optional[str] = None
    notes: Optional[str] = None


# ==========================================
# Incident Schemas
# ==========================================
class IncidentResponse(BaseModel):
    id: str
    workspace_id: str
    incident_number: str
    title: str
    description: Optional[str] = None
    status: str
    severity: str
    lead_source_ip: Optional[str] = None
    target_destination_ip: Optional[str] = None
    correlation_rule: str
    ai_investigation_summary: Optional[str] = None
    alert_count: int = 0
    alerts: Optional[List[AlertResponse]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AI Investigator Schemas
# ==========================================
class AIInvestigationRequest(BaseModel):
    alert_id: Optional[str] = None
    incident_id: Optional[str] = None
    query: Optional[str] = None


class AIInvestigationResponse(BaseModel):
    target_id: str
    target_type: str  # alert or incident
    summary: str
    observed_evidence: List[str]
    attack_hypotheses: List[Dict[str, Any]]
    recommended_actions: List[Dict[str, str]]
    missing_telemetry: List[str]
    confidence_statement: str
    generated_at: str
    provider: str


# ==========================================
# Analytics Schemas
# ==========================================
class SeverityCount(BaseModel):
    severity: str
    count: int


class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class VolumeTimePoint(BaseModel):
    timestamp: str
    total_events: int
    threat_events: int


class DashboardAnalyticsResponse(BaseModel):
    total_events_processed: int
    threats_detected: int
    active_alerts: int
    open_incidents: int
    benign_ratio: float
    threat_ratio: float
    pipeline_health: str
    avg_latency_ms: float
    severity_breakdown: List[SeverityCount]
    category_breakdown: List[CategoryCount]
    volume_timeline: List[VolumeTimePoint]


# ==========================================
# Audit Log Schema
# ==========================================
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

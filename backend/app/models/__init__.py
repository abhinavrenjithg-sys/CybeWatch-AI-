import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class SeverityLevel(str, enum.Enum):
    BENIGN = "benign"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    NEW = "new"
    TRIAGED = "triaged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    memberships = relationship("WorkspaceMembership", back_populates="user", cascade="all, delete-orphan")
    assigned_alerts = relationship("Alert", back_populates="assigned_user")
    investigation_notes = relationship("InvestigationNote", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    memberships = relationship("WorkspaceMembership", back_populates="workspace", cascade="all, delete-orphan")
    events = relationship("SecurityEvent", back_populates="workspace", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="workspace", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="workspace", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMembership(Base):
    __tablename__ = "workspace_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="memberships")
    user = relationship("User", back_populates="memberships")


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    event_timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    source_ip = Column(String(64), nullable=False, index=True)
    destination_ip = Column(String(64), nullable=False, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True, index=True)
    protocol = Column(String(16), nullable=False, default="tcp", index=True)
    service = Column(String(32), nullable=True, default="-")
    
    # Flow characteristics
    duration = Column(Float, nullable=False, default=0.0)
    src_bytes = Column(Integer, nullable=False, default=0)
    dst_bytes = Column(Integer, nullable=False, default=0)
    src_pkts = Column(Integer, nullable=False, default=0)
    dst_pkts = Column(Integer, nullable=False, default=0)
    
    # Statistical flow metrics
    sload = Column(Float, nullable=False, default=0.0)
    dload = Column(Float, nullable=False, default=0.0)
    sttl = Column(Integer, nullable=False, default=64)
    dttl = Column(Integer, nullable=False, default=64)
    loss_rate = Column(Float, nullable=False, default=0.0)
    
    # Ingestion metadata
    raw_payload = Column(JSON, nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    ingestion_source = Column(String(64), default="api_ingest", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="events")
    prediction = relationship("Prediction", back_populates="event", uselist=False, cascade="all, delete-orphan")
    alert = relationship("Alert", back_populates="event", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_events_ws_time", "workspace_id", "event_timestamp"),
        Index("ix_events_src_dst", "source_ip", "destination_ip"),
    )


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    version = Column(String(64), nullable=False, unique=True)
    algorithm = Column(String(64), nullable=False)
    dataset_name = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    metrics = Column(JSON, nullable=False)  # Precision, recall, f1, roc_auc, confusion_matrix
    feature_names = Column(JSON, nullable=False)
    parameters = Column(JSON, nullable=True)
    artifact_path = Column(String(512), nullable=False)
    trained_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    predictions = relationship("Prediction", back_populates="model_version")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    model_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True, index=True)
    
    predicted_category = Column(String(64), nullable=False, index=True)  # Benign, DoS, PortScan, BruteForce, Botnet, Exploits
    is_threat = Column(Boolean, nullable=False, default=False, index=True)
    threat_score = Column(Float, nullable=False, index=True)  # Model anomaly/threat score [0.0 - 1.0]
    severity = Column(SQLEnum(SeverityLevel), default=SeverityLevel.BENIGN, nullable=False)
    
    # Explainability output (top positive/negative feature contributions)
    feature_contributions = Column(JSON, nullable=True)
    latency_ms = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    event = relationship("SecurityEvent", back_populates="prediction")
    model_version = relationship("ModelVersion", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(SQLEnum(SeverityLevel), nullable=False, index=True)
    threat_score = Column(Float, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.NEW, nullable=False, index=True)
    
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    model_version = Column(String(64), nullable=True)
    summary = Column(Text, nullable=True)
    mitre_technique = Column(String(128), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="alerts")
    event = relationship("SecurityEvent", back_populates="alert")
    assigned_user = relationship("User", back_populates="assigned_alerts")
    notes = relationship("InvestigationNote", back_populates="alert", cascade="all, delete-orphan")
    incident_associations = relationship("IncidentEvent", back_populates="alert", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_alerts_ws_status_sev", "workspace_id", "status", "severity"),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_number = Column(String(32), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.OPEN, nullable=False, index=True)
    severity = Column(SQLEnum(SeverityLevel), default=SeverityLevel.HIGH, nullable=False)
    
    lead_source_ip = Column(String(64), nullable=True, index=True)
    target_destination_ip = Column(String(64), nullable=True, index=True)
    correlation_rule = Column(String(128), nullable=False)
    ai_investigation_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="incidents")
    incident_events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    notes = relationship("InvestigationNote", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_id = Column(String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="incident_events")
    alert = relationship("Alert", back_populates="incident_associations")


class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=True, index=True)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    alert = relationship("Alert", back_populates="notes")
    incident = relationship("Incident", back_populates="notes")
    author = relationship("User", back_populates="investigation_notes")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(64), nullable=False, index=True)  # e.g., "ALERT_STATUS_UPDATE", "NOTE_ADDED", "INCIDENT_CREATED"
    resource_type = Column(String(64), nullable=False)      # e.g., "alert", "incident", "user"
    resource_id = Column(String(36), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    workspace = relationship("Workspace", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")


class DatasetImportJob(Base):
    __tablename__ = "dataset_import_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, default=0, nullable=False)
    imported_records = Column(Integer, default=0, nullable=False)
    threats_detected = Column(Integer, default=0, nullable=False)
    status = Column(String(32), default="pending", nullable=False)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

import os
import json
import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, get_current_workspace
from app.models import SecurityEvent, Prediction, Workspace, User
from app.schemas import (
    SecurityEventCreate,
    SecurityEventResponse,
    BatchIngestRequest,
    BatchIngestResponse
)
from app.services.ingestion import IngestionService
from app.core.config import settings

router = APIRouter()


@router.get("", response_model=List[SecurityEventResponse])
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    source_ip: Optional[str] = None,
    protocol: Optional[str] = None,
    threat_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """List normalized security events with pagination and filters."""
    query = (
        db.query(SecurityEvent)
        .outerjoin(Prediction, SecurityEvent.id == Prediction.event_id)
        .filter(SecurityEvent.workspace_id == workspace.id)
    )

    if source_ip:
        query = query.filter(SecurityEvent.source_ip.ilike(f"%{source_ip}%"))
    if protocol:
        query = query.filter(SecurityEvent.protocol == protocol.lower())
    if threat_only is True:
        query = query.filter(Prediction.is_threat == True)
    elif threat_only is False:
        query = query.filter(Prediction.is_threat == False)

    events = query.order_by(desc(SecurityEvent.event_timestamp)).offset(skip).limit(limit).all()
    return [SecurityEventResponse.model_validate(e) for e in events]


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Retrieve details and prediction for an individual security event."""
    event = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.id == event_id)
        .filter(SecurityEvent.workspace_id == workspace.id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    return SecurityEventResponse.model_validate(event)


@router.post("/ingest", response_model=SecurityEventResponse)
def ingest_event(
    event_in: SecurityEventCreate,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Ingest a single network event, run ML classification, and generate alerts if malicious."""
    service = IngestionService(db)
    sec_event, _ = service.process_event(event_in, workspace.id)
    return SecurityEventResponse.model_validate(sec_event)


@router.post("/batch", response_model=BatchIngestResponse)
def ingest_batch(
    batch_in: BatchIngestRequest,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Batch ingest validated network flow telemetry."""
    service = IngestionService(db)
    result = service.process_batch(batch_in.events, workspace.id)
    return BatchIngestResponse(**result)


@router.post("/upload-csv", response_model=BatchIngestResponse)
async def upload_csv_events(
    file: UploadFile = File(...),
    is_synthetic: bool = Query(False),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Upload and process standard flow CSV telemetry."""
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
        
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum safe limit of 20MB.")
        
    service = IngestionService(db)
    result = service.process_csv_file(contents, workspace.id, is_synthetic=is_synthetic)
    return BatchIngestResponse(**result)


@router.post("/simulate", response_model=BatchIngestResponse)
def simulate_traffic(
    count: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """
    Replay a realistic stream of sample network flows from the benchmark dataset
    directly into the active workspace for safe live demonstration.
    """
    sample_json_path = os.path.join(settings.DATASETS_DIR, "sample", "sample_events.json")
    if not os.path.exists(sample_json_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found. Run prepare_data.py first.")

    with open(sample_json_path, "r") as f:
        samples = json.load(f)

    # Pick random subset
    selected = random.sample(samples, min(count, len(samples)))
    
    events_in = []
    for item in selected:
        ev = SecurityEventCreate(
            source_ip=item["source_ip"],
            destination_ip=item["destination_ip"],
            source_port=item["source_port"],
            destination_port=item["destination_port"],
            protocol=item["protocol"],
            service=item["service"],
            duration=item["duration"],
            src_bytes=item["src_bytes"],
            dst_bytes=item["dst_bytes"],
            src_pkts=item["src_pkts"],
            dst_pkts=item["dst_pkts"],
            sload=item["sload"],
            dload=item["dload"],
            sttl=item["sttl"],
            dttl=item["dttl"],
            loss_rate=item["loss_rate"],
            is_synthetic=True,
            ingestion_source="simulator_stream",
            event_timestamp=datetime.now(timezone.utc)
        )
        events_in.append(ev)

    service = IngestionService(db)
    result = service.process_batch(events_in, workspace.id)
    return BatchIngestResponse(**result)

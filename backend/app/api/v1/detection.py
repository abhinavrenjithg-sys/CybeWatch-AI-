from fastapi import APIRouter, HTTPException
from app.schemas import SecurityEventCreate, PredictionResponse
from ml.predict import ThreatPredictionEngine

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def test_threat_prediction(event_in: SecurityEventCreate):
    """
    Real-time Threat Detection Sandbox.
    Evaluates raw network flow telemetry through the trained ML model and returns
    predicted category, threat score, latency, and explainability contributions.
    """
    engine = ThreatPredictionEngine.get_instance()
    if not engine.is_ready():
        raise HTTPException(status_code=503, detail="Threat prediction model is not initialized.")
        
    result = engine.predict_single(event_in.model_dump())
    return PredictionResponse(**result)

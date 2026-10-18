from typing import List, Dict, Any
from fastapi import APIRouter
from ..schemas import PredictionResponse

router = APIRouter(prefix="/api", tags=["History"])

# In-memory session history
SESSION_PREDICTION_HISTORY: List[Dict[str, Any]] = []

def add_to_history(prediction: Dict[str, Any]):
    SESSION_PREDICTION_HISTORY.insert(0, prediction)
    # Cap at latest 200 items to avoid unbounded memory growth
    if len(SESSION_PREDICTION_HISTORY) > 200:
        SESSION_PREDICTION_HISTORY.pop()

@router.get("/prediction-history", response_model=List[PredictionResponse])
def get_prediction_history():
    return SESSION_PREDICTION_HISTORY

@router.delete("/prediction-history")
def clear_prediction_history():
    SESSION_PREDICTION_HISTORY.clear()
    return {"message": "Prediction history cleared successfully", "count": 0}

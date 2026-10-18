from fastapi import APIRouter
from ..model_loader import model_manager
from ..schemas import ModelInfoResponse

router = APIRouter(prefix="/api", tags=["Model Info"])

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    return model_manager.get_model_info()

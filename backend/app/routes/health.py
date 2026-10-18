from fastapi import APIRouter
from ..model_loader import model_manager
from ..services.pest_detection_service import pest_service
from ..services.nutrient_service import nutrient_service
from ..services.crop_yield_service import yield_service
from ..schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    is_healthy = (
        model_manager.is_loaded or 
        pest_service.is_loaded or 
        nutrient_service.is_loaded or 
        yield_service.is_loaded
    )
    return {
        "status": "healthy" if is_healthy else "degraded",
        "model_loaded": model_manager.is_loaded,
        "model_path": str(model_manager.model_path),
        "classes_count": len(model_manager.class_names),
        "error": model_manager.load_error or pest_service.load_error or nutrient_service.load_error or yield_service.load_error,
        "pest_model_loaded": pest_service.is_loaded,
        "pest_model_path": str(pest_service.model_path),
        "pest_classes_count": len(pest_service.class_names),
        "nutrient_model_loaded": nutrient_service.is_loaded,
        "nutrient_model_path": str(nutrient_service.model_path),
        "nutrient_classes_count": len(nutrient_service.class_names),
        "yield_model_loaded": yield_service.is_loaded,
        "yield_model_path": str(yield_service.model_path),
        "yield_crops_count": len(yield_service.crops),
        "yield_districts_count": len(yield_service.districts),
        "market_price_loaded": True,
        "market_price_commodities_count": 13
    }


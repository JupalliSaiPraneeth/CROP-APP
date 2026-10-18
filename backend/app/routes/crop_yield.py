import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query

from ..services.crop_yield_service import yield_service
from ..schemas import (
    CropYieldPredictRequest,
    CropYieldPredictionResponse,
    CropYieldBatchPredictRequest,
    CropYieldBatchPredictResponse,
    CropYieldCategoriesResponse,
    CropYieldModelInfoResponse,
    CropYieldPresetItem
)
from .history import add_to_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crop-yield", tags=["Crop Yield Prediction"])


@router.post("/predict", response_model=CropYieldPredictionResponse)
def predict_crop_yield(payload: CropYieldPredictRequest):
    """
    Predicts agricultural crop yield (Tonnes per Hectare) and total harvest
    using the Random Forest Regressor Pipeline.
    """
    try:
        result = yield_service.predict(
            state=payload.state,
            district=payload.district,
            season=payload.season,
            crop=payload.crop,
            crop_year=payload.crop_year,
            area=payload.area
        )

        # Log into global session history for overview dashboard
        add_to_history({
            "id": result["id"],
            "filename": f"{payload.crop.replace('/', '_')}_{payload.district}.plot",
            "predicted_class": f"[Yield] {result['crop']}: {result['predicted_yield_per_hectare']} T/Ha",
            "confidence": 0.792,
            "confidence_level": result["yield_category"],
            "is_low_confidence": False,
            "inference_time_ms": result["inference_time_ms"],
            "timestamp": result["timestamp"],
            "top_predictions": [
                {
                    "class_name": f"Total: {result['estimated_total_production_tonnes']} Tonnes ({result['estimated_total_production_quintals']} Q)",
                    "score": 0.792,
                    "percentage": 79.2
                }
            ],
            "treatment": None,
            "ground_truth": None,
            "is_correct": None
        })

        return result

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        logger.error("Error during crop yield prediction: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crop yield inference failed: {str(e)}"
        )


@router.post("/predict-batch", response_model=CropYieldBatchPredictResponse)
def predict_crop_yield_batch(payload: CropYieldBatchPredictRequest):
    """
    Processes batch crop yield estimations across multiple farming plots or fields.
    """
    try:
        items_dict = [item.model_dump() for item in payload.items]
        return yield_service.predict_batch(items_dict)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error("Error during batch crop yield prediction: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch crop yield prediction failed: {str(e)}"
        )


@router.get("/categories", response_model=CropYieldCategoriesResponse)
def get_categories():
    """
    Retrieves all available Indian states, districts, seasons, crops, and curated quick presets.
    """
    return yield_service.get_categories()


@router.get("/presets", response_model=List[CropYieldPresetItem])
def get_presets():
    """
    Returns curated regional crop presets for quick 1-click testing.
    """
    return yield_service.presets


@router.get("/model-info", response_model=CropYieldModelInfoResponse)
def get_model_info():
    """
    Returns architecture details, evaluation metrics (R2, MAE, RMSE), and feature importances.
    """
    return yield_service.get_model_info()


@router.get("/simulate-scenarios")
def simulate_scenarios(
    state: str = Query(..., description="Indian State"),
    district: str = Query(..., description="District Name"),
    area: float = Query(..., gt=0, description="Area in Hectares"),
    crop_year: int = Query(2024, description="Harvest Year")
):
    """
    Simulates comparative yields across diverse staple and cash crops for the same plot.
    """
    try:
        scenarios = yield_service.simulate_scenarios(
            state=state,
            district=district,
            area=area,
            crop_year=crop_year
        )
        return {
            "state": state,
            "district": district,
            "area": area,
            "scenarios": scenarios
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )

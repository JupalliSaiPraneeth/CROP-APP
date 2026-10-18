import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from ..services.market_price_service import market_price_service
from ..schemas import (
    MarketPricePredictRequest,
    MarketPricePredictionResponse,
    MarketPriceCommoditiesResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/market-price", tags=["Market Price Prediction"])


@router.get("/commodities", response_model=MarketPriceCommoditiesResponse)
def get_commodities():
    """
    Returns full list of supported crops/commodities, categories, states,
    and regional APMC mandis calibrated against Agmarknet records.
    """
    return market_price_service.get_commodities()


@router.post("/predict", response_model=MarketPricePredictionResponse)
def predict_price(payload: MarketPricePredictRequest):
    """
    Predicts wholesale mandi price (per Quintal & per Tonne), projected retail price,
    MSP benchmark spread, 12-month forward curve, and optimal selling timing.
    """
    try:
        return market_price_service.predict_price(
            commodity=payload.commodity,
            state=payload.state,
            mandi=payload.mandi,
            target_month=payload.target_month,
            crop_year=payload.crop_year
        )
    except Exception as e:
        logger.error("Error predicting market price: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Market price forecast failed: {str(e)}"
        )


@router.get("/historical")
def get_historical_trends(
    commodity: str = Query(..., description="Crop or Commodity name"),
    state: Optional[str] = Query(None, description="State name")
):
    """
    Returns 3-year historical monthly mandi prices for time-series trend analysis.
    """
    try:
        return market_price_service.get_historical_trends(
            commodity=commodity,
            state=state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical price trends: {str(e)}"
        )


@router.get("/model-info")
def get_model_info():
    """
    Returns architecture specifications, MAPE/RMSE accuracy metrics, and data sources.
    """
    return market_price_service.model_info

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model_loader import model_manager
from .services.pest_detection_service import pest_service
from .services.nutrient_service import nutrient_service
from .services.crop_yield_service import yield_service
from .routes import (
    health,
    model_info,
    predict,
    evaluate,
    dataset_info,
    history,
    pest_detection,
    nutrient_deficiency,
    crop_yield,
    market_price
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CropAI 5-Model Engine ready to serve (Low-memory lazy-loading enabled).")
    logger.info("Loaded metadata: %d yield crops, %d states, %d districts, 13 market commodities.", 
                len(yield_service.crops), len(yield_service.states), len(yield_service.districts))
    yield
    logger.info("CropAI server shutting down.")

app = FastAPI(
    title="CropAI AgTech Suite — Disease, Pest, Nutrient & Yield AI",
    description="FastAPI backend connecting MobileNetV3 for crop diseases, YOLO11 for insect pests, MobileNetV3 for OLID-I nutrient deficiency, and Random Forest Regressor for crop yield forecasting.",
    version="1.3.0",
    lifespan=lifespan
)

# CORS configuration for frontend development & cloud deployments (Vercel, Render, Railway, etc.)
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:5173",
]

cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env.strip():
    custom_origins = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
else:
    custom_origins = []

all_origins = default_origins + custom_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins if "*" not in all_origins else ["*"],
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app|https://.*\.onrender\.com|https://.*\.railway\.app|https://.*\.hf\.space"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(model_info.router)
app.include_router(predict.router)
app.include_router(evaluate.router)
app.include_router(dataset_info.router)
app.include_router(history.router)
app.include_router(pest_detection.router)
app.include_router(nutrient_deficiency.router)
app.include_router(crop_yield.router)
app.include_router(market_price.router)

@app.get("/")
def root():
    return {
        "message": "CropAI 5-Model Suite (Disease, Pest, Nutrient, Yield, Market Price) API is live & ready",
        "documentation": "/docs",
        "health": "/api/health",
        "status": "ready",
        "model_loaded": model_manager.is_loaded or model_manager.model_path.exists(),
        "crop_model_loaded": model_manager.is_loaded or model_manager.model_path.exists(),
        "pest_model_loaded": pest_service.is_loaded or pest_service.model_path.exists(),
        "nutrient_model_loaded": nutrient_service.is_loaded or nutrient_service.model_path.exists(),
        "yield_model_loaded": yield_service.is_loaded or yield_service.model_path.exists(),
        "market_price_loaded": True
    }


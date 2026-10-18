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
    logger.info("Initializing 4-Model Crop, Pest, Nutrient & Yield AI Services...")
    if model_manager.is_loaded:
        logger.info("Crop Disease model loaded: %s (%d classes)", model_manager.model_path.name, len(model_manager.class_names))
    else:
        logger.warning("Crop Disease model failed to load at startup: %s", model_manager.load_error)

    if pest_service.is_loaded:
        logger.info("YOLO Pest Detection model loaded: %s (%d classes)", pest_service.model_path.name, len(pest_service.class_names))
    else:
        logger.warning("YOLO Pest Detection model failed to load at startup: %s", pest_service.load_error)

    if nutrient_service.is_loaded:
        logger.info("Nutrient Deficiency model loaded: %s (%d classes)", nutrient_service.model_path.name, len(nutrient_service.class_names))
    else:
        logger.warning("Nutrient Deficiency model failed to load at startup: %s", nutrient_service.load_error)

    if yield_service.is_loaded:
        logger.info("Crop Yield Random Forest model loaded: %s (%d crops, %d states, %d districts)", yield_service.model_path.name, len(yield_service.crops), len(yield_service.states), len(yield_service.districts))
    else:
        logger.warning("Crop Yield model failed to load at startup: %s", yield_service.load_error)
    yield

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
        "message": "CropAI 5-Model Suite (Disease, Pest, Nutrient, Yield, Market Price) API is running",
        "documentation": "/docs",
        "model_loaded": model_manager.is_loaded,
        "crop_model_loaded": model_manager.is_loaded,
        "pest_model_loaded": pest_service.is_loaded,
        "nutrient_model_loaded": nutrient_service.is_loaded,
        "yield_model_loaded": yield_service.is_loaded,
        "market_price_loaded": True
    }


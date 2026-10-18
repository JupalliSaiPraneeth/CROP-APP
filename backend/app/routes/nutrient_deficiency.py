from typing import List, Optional
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse

from ..services.nutrient_service import nutrient_service
from ..schemas import (
    NutrientPredictionResponse,
    NutrientBatchPredictionResponse,
    NutrientModelInfoResponse
)
from ..config import (
    MAX_UPLOAD_SIZE_MB,
    NUTRIENT_CONFIDENCE_THRESHOLD,
    TEST_IMAGES_DIR
)
from .history import add_to_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nutrient-deficiency", tags=["Nutrient Deficiency"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def validate_image_file(file: UploadFile, content: bytes):
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB"
        )
    filename = file.filename or "uploaded_leaf.jpg"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS and not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

@router.post("/predict", response_model=NutrientPredictionResponse)
async def predict_nutrient_deficiency(
    file: UploadFile = File(...),
    ground_truth: Optional[str] = Form(None),
    threshold: Optional[float] = Form(NUTRIENT_CONFIDENCE_THRESHOLD),
    crop_hint: Optional[str] = Form(None)
):
    """
    Classifies plant leaf nutrient deficiency across 36 categories
    (N, K, N+K, K+Mg, N+Mg, healthy) for 8 vegetable and gourd crops.
    """
    try:
        content = await file.read()
        validate_image_file(file, content)

        conf_threshold = threshold if threshold is not None else NUTRIENT_CONFIDENCE_THRESHOLD

        result = nutrient_service.predict(
            image_bytes=content,
            filename=file.filename or "uploaded_leaf.jpg",
            ground_truth=ground_truth,
            threshold=conf_threshold,
            crop_hint=crop_hint
        )

        # Record to global history for overview logging
        add_to_history({
            "id": result["id"],
            "filename": result["filename"],
            "predicted_class": f"[Nutrient] {result['predicted_class']}",
            "confidence": result["confidence"],
            "confidence_level": result["confidence_level"],
            "is_low_confidence": result["is_low_confidence"],
            "inference_time_ms": result["inference_time_ms"],
            "timestamp": result["timestamp"],
            "top_predictions": [
                {"class_name": p["class_name"], "score": p["score"], "percentage": p["percentage"]}
                for p in result["top_predictions"]
            ],
            "treatment": None,
            "ground_truth": ground_truth,
            "is_correct": result["is_correct"]
        })

        return result

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        logger.error("Error during nutrient deficiency prediction: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Nutrient deficiency inference failed: {str(e)}"
        )

@router.post("/predict-batch", response_model=NutrientBatchPredictionResponse)
async def predict_nutrient_deficiency_batch(
    files: List[UploadFile] = File(...),
    threshold: Optional[float] = Form(NUTRIENT_CONFIDENCE_THRESHOLD),
    crop_hint: Optional[str] = Form(None)
):
    """Batch inference for up to 50 leaf photos simultaneously."""
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded")

    if len(files) > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch size limit is 50 images per request")

    results = []
    total_time = 0.0

    for file in files:
        try:
            content = await file.read()
            validate_image_file(file, content)

            res = nutrient_service.predict(
                image_bytes=content,
                filename=file.filename or "uploaded_leaf.jpg",
                threshold=threshold if threshold is not None else NUTRIENT_CONFIDENCE_THRESHOLD,
                crop_hint=crop_hint
            )
            results.append(res)
            total_time += res["inference_time_ms"]
        except Exception as e:
            logger.warning("Failed prediction on batch item %s: %s", file.filename, e)
            results.append({
                "id": str(len(results)),
                "filename": file.filename or "error.jpg",
                "predicted_class": "Unreadable / Failed",
                "crop": "unknown",
                "crop_name": "Unknown Crop",
                "condition": "error",
                "deficiency_title": "Processing Error",
                "is_healthy": False,
                "severity": "Unknown",
                "confidence": 0.0,
                "confidence_level": "Low",
                "is_low_confidence": True,
                "inference_time_ms": 0.0,
                "timestamp": "",
                "top_predictions": [],
                "remedy": None,
                "ground_truth": None,
                "is_correct": False
            })

    avg_time = round(total_time / max(len(results), 1), 2)
    return {
        "total_images": len(results),
        "results": results,
        "avg_inference_time_ms": avg_time
    }

@router.get("/model-info", response_model=NutrientModelInfoResponse)
def get_nutrient_model_info():
    """Returns architecture, classes, and evaluation metrics for the Nutrient Deficiency model."""
    return nutrient_service.get_model_info()

@router.get("/classes")
def get_nutrient_classes():
    """Returns all 36 categories grouped by crop and deficiency type."""
    return nutrient_service.get_classes()

@router.get("/manifest-summary")
def get_manifest_summary():
    """Returns crop and deficiency distribution from the OLID-I dataset manifest."""
    return nutrient_service.manifest_summary

@router.get("/training-history")
def get_training_history():
    """Returns the 20-epoch training and validation loss/accuracy log."""
    return nutrient_service.training_log

@router.get("/sample/{sample_name}")
def get_sample_nutrient_image(sample_name: str):
    """Provides high-quality realistic agricultural test images for nutrient deficiency verification."""
    name_map = {
        "tomato_nitrogen": "nutrient_tomato_nitrogen.jpg",
        "cucumber_potassium": "nutrient_cucumber_potassium.jpg",
        "tomato_healthy": "nutrient_tomato_healthy.jpg",
        "eggplant_healthy": "nutrient_eggplant_healthy.jpg"
    }
    file_name = name_map.get(sample_name.lower().strip())
    if not file_name:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{sample_name}' not found. Available: {list(name_map.keys())}"
        )

    file_path = TEST_IMAGES_DIR / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample image file not found on disk")

    return FileResponse(path=str(file_path), media_type="image/jpeg")

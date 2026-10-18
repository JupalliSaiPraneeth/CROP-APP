from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import logging

from fastapi.responses import FileResponse
from ..services.pest_detection_service import pest_service
from ..schemas import PestDetectionResponse, PestModelInfoResponse
from ..config import (
    MAX_UPLOAD_SIZE_MB, 
    PEST_CONFIDENCE_THRESHOLD, 
    PEST_IOU_THRESHOLD,
    PEST_DEFAULT_IMGSZ,
    TEST_IMAGES_DIR
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pest-detection", tags=["Pest Detection"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def validate_image_upload(file: UploadFile, content: bytes):
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB"
        )
    filename = file.filename or "uploaded_image.jpg"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS and not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

@router.post("/predict", response_model=PestDetectionResponse)
async def detect_pests(
    file: UploadFile = File(...),
    confidence_threshold: Optional[float] = Form(PEST_CONFIDENCE_THRESHOLD),
    iou_threshold: Optional[float] = Form(PEST_IOU_THRESHOLD),
    imgsz: Optional[int] = Form(PEST_DEFAULT_IMGSZ),
    augment: Optional[bool] = Form(False)
):
    """
    Detect insect pests in an uploaded photograph using the trained YOLO11 best.pt model.
    Supports adjustable confidence threshold, multi-scale resolution (imgsz), and TTA augmentation.
    """
    try:
        content = await file.read()
        validate_image_upload(file, content)

        conf = confidence_threshold if confidence_threshold is not None else PEST_CONFIDENCE_THRESHOLD
        iou = iou_threshold if iou_threshold is not None else PEST_IOU_THRESHOLD
        target_imgsz = imgsz if imgsz is not None else PEST_DEFAULT_IMGSZ

        result = pest_service.predict(
            image_bytes=content,
            filename=file.filename or "uploaded_pest.jpg",
            confidence_threshold=conf,
            iou_threshold=iou,
            imgsz=target_imgsz,
            augment=bool(augment)
        )
        return result
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        logger.error("Unexpected error during pest detection inference: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pest detection inference failed: {str(e)}"
        )

@router.get("/model-info", response_model=PestModelInfoResponse)
def get_pest_model_info():
    """Returns architecture, classes, and training metrics for the YOLO pest detection model."""
    return pest_service.get_model_info()

@router.get("/classes")
def get_pest_classes():
    """Returns the complete list of 97 classes detected by the model and taxonomy mapping."""
    return {
        "num_classes": len(pest_service.class_names),
        "classes": pest_service.class_names,
        "taxonomy": pest_service.taxonomy_map
    }

@router.get("/sample/{sample_name}")
def get_sample_pest_image(sample_name: str):
    """Provides high-quality realistic insect test images for testing pest detection."""
    name_map = {
        "caterpillar": "pest_caterpillar.jpg",
        "beetle": "pest_beetle.jpg",
        "locust": "pest_locust.jpg"
    }
    file_name = name_map.get(sample_name.lower().strip())
    if not file_name:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_name}' not found. Available: {list(name_map.keys())}")
    
    file_path = TEST_IMAGES_DIR / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample image file not found on disk")
    
    return FileResponse(path=str(file_path), media_type="image/jpeg")

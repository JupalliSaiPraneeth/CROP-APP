from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from ..inference import run_single_inference
from ..schemas import PredictionResponse, BatchPredictionResponse
from ..config import MAX_UPLOAD_SIZE_MB, CONFIDENCE_THRESHOLD
from .history import add_to_history

router = APIRouter(prefix="/api", tags=["Prediction"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def validate_image_file(file: UploadFile, content: bytes):
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

@router.post("/predict", response_model=PredictionResponse)
async def predict_single_image(
    file: UploadFile = File(...),
    ground_truth: Optional[str] = Form(None),
    threshold: Optional[float] = Form(CONFIDENCE_THRESHOLD)
):
    try:
        content = await file.read()
        validate_image_file(file, content)
        
        result = run_single_inference(
            image_bytes=content,
            filename=file.filename or "uploaded_image.jpg",
            ground_truth=ground_truth,
            threshold=threshold or CONFIDENCE_THRESHOLD
        )
        
        add_to_history(result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference failed: {str(e)}")

@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch_images(
    files: List[UploadFile] = File(...),
    threshold: Optional[float] = Form(CONFIDENCE_THRESHOLD)
):
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
            
            # Ground truth can optionally be deduced from filename if format is "Class___Name_sample.jpg"
            deduced_gt = None
            fn = file.filename or ""
            if "___" in fn:
                deduced_gt = fn.split("_")[0] + "___" + fn.split("___")[1].split("_")[0]

            res = run_single_inference(
                image_bytes=content,
                filename=fn,
                ground_truth=deduced_gt,
                threshold=threshold or CONFIDENCE_THRESHOLD
            )
            add_to_history(res)
            results.append(res)
            total_time += res["inference_time_ms"]
        except Exception as e:
            # Report individual failed predictions rather than failing entire batch
            results.append({
                "id": str(len(results)),
                "filename": file.filename or "error.jpg",
                "predicted_class": "Unreadable / Failed",
                "confidence": 0.0,
                "confidence_level": "Low",
                "is_low_confidence": True,
                "inference_time_ms": 0.0,
                "timestamp": "",
                "top_predictions": [],
                "treatment": None,
                "ground_truth": None,
                "is_correct": False
            })

    avg_time = round(total_time / max(len(results), 1), 2)
    return {
        "total_images": len(results),
        "results": results,
        "metrics": None,
        "avg_inference_time_ms": avg_time
    }

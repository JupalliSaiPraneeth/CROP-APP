from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel

from ..inference import run_single_inference
from ..evaluation import (
    calculate_evaluation_metrics,
    get_latest_evaluation,
    export_predictions_csv,
    export_classification_report_csv,
    generate_pdf_report
)
from ..config import DATASETS_DIR, TEST_IMAGES_DIR
from ..model_loader import model_manager
from .history import SESSION_PREDICTION_HISTORY

router = APIRouter(prefix="/api", tags=["Evaluation"])

class EvaluationRequest(BaseModel):
    samples_per_class: int = 5
    max_total_samples: int = 190
    source_folder: str = "PlantVillage" # "PlantVillage" or "test_images"

@router.post("/evaluate")
def run_dataset_evaluation(payload: EvaluationRequest):
    if not model_manager.is_loaded:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model is not loaded")

    # Select evaluation directory
    if payload.source_folder == "test_images":
        target_dir = TEST_IMAGES_DIR
        if not target_dir.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="test_images folder does not exist")
        # In test_images, look for images directly or class subfolders
        image_paths = list(target_dir.glob("*.jpg")) + list(target_dir.glob("*.JPG"))
        y_true = []
        y_pred = []
        inf_times = []
        
        for p in image_paths[:payload.max_total_samples]:
            # Deducing label from filename if available
            gt = p.stem.split("_")[0] if "_" in p.stem else "Unknown"
            with open(p, "rb") as f:
                res = run_single_inference(f.read(), filename=p.name, ground_truth=gt)
            y_true.append(gt)
            y_pred.append(res["predicted_class"])
            inf_times.append(res["inference_time_ms"])

        if not y_true:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No test images found in test_images")
        return calculate_evaluation_metrics(y_true, y_pred, inf_times)

    # By default evaluate on real images in PlantVillage dataset
    target_dir = DATASETS_DIR
    if not target_dir.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset path {target_dir} not found")

    y_true = []
    y_pred = []
    inf_times = []
    total_evaluated = 0

    class_dirs = sorted([d for d in target_dir.iterdir() if d.is_dir()])
    
    for c_dir in class_dirs:
        gt_class = c_dir.name
        # Sample files from the end of the folder to simulate a distinct test split
        files = sorted(list(c_dir.glob("*.JPG")) + list(c_dir.glob("*.jpg")))
        sample_files = files[-payload.samples_per_class:] if len(files) >= payload.samples_per_class else files
        
        for img_path in sample_files:
            if total_evaluated >= payload.max_total_samples:
                break
            try:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()
                res = run_single_inference(img_bytes, filename=img_path.name, ground_truth=gt_class)
                y_true.append(gt_class)
                y_pred.append(res["predicted_class"])
                inf_times.append(res["inference_time_ms"])
                total_evaluated += 1
            except Exception as e:
                continue
        if total_evaluated >= payload.max_total_samples:
            break

    if not y_true:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable images found for evaluation")

    return calculate_evaluation_metrics(y_true, y_pred, inf_times, classes=model_manager.class_names)

@router.get("/evaluation-results")
def get_evaluation_results():
    results = get_latest_evaluation()
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No previous evaluation found. Run evaluation first.")
    return results

@router.get("/export/csv")
def export_history_csv():
    if not SESSION_PREDICTION_HISTORY:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No prediction history available to export.")
    csv_content = export_predictions_csv(SESSION_PREDICTION_HISTORY)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prediction_history.csv"}
    )

@router.get("/export/classification-report")
def export_report_csv():
    results = get_latest_evaluation()
    if not results or "classification_report" not in results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No evaluation results found.")
    csv_content = export_classification_report_csv(results["classification_report"])
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=classification_report.csv"}
    )

@router.get("/export/pdf")
def export_pdf():
    results = get_latest_evaluation()
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No evaluation results available to generate PDF.")
    pdf_bytes = generate_pdf_report(results)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=model_evaluation_report.pdf"}
    )

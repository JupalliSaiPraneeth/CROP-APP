import os
from pathlib import Path
from typing import Dict, List
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from ..config import DATASETS_DIR
from ..schemas import DatasetInfoResponse, DatasetClassInfo

router = APIRouter(prefix="/api", tags=["Dataset"])

@router.get("/dataset-info", response_model=DatasetInfoResponse)
def get_dataset_info():
    if not DATASETS_DIR.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset directory not found at {DATASETS_DIR}")

    classes_info: List[DatasetClassInfo] = []
    crops_summary: Dict[str, int] = {}
    total_imgs = 0

    class_dirs = sorted([d for d in DATASETS_DIR.iterdir() if d.is_dir()])

    for c_dir in class_dirs:
        class_name = c_dir.name
        files = [f.name for f in c_dir.glob("*.JPG")] + [f.name for f in c_dir.glob("*.jpg")]
        count = len(files)
        total_imgs += count

        parts = class_name.split("___")
        crop = parts[0].replace("_", " ")
        disease_status = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown"

        crops_summary[crop] = crops_summary.get(crop, 0) + count

        classes_info.append(DatasetClassInfo(
            name=class_name,
            crop=crop,
            disease_status=disease_status,
            image_count=count,
            sample_images=files[:3]
        ))

    return DatasetInfoResponse(
        dataset_name="PlantVillage (Color Subset)",
        path=str(DATASETS_DIR),
        total_images=total_imgs,
        num_classes=len(classes_info),
        classes=classes_info,
        crops_summary=crops_summary
    )

@router.get("/dataset-image/{class_name}/{image_name}")
def get_sample_image(class_name: str, image_name: str):
    # Path traversal protection
    safe_class = os.path.basename(class_name)
    safe_image = os.path.basename(image_name)

    image_path = DATASETS_DIR / safe_class / safe_image
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample image not found")

    return FileResponse(image_path)

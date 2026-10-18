import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR / "models" if (BASE_DIR / "models").exists() else Path(__file__).resolve().parent.parent / "models")))
DATASETS_DIR = BASE_DIR / "datasets" / "PlantVillage" / "extracted" / "raw" / "color"
TEST_IMAGES_DIR = BASE_DIR / "test_images"
REPORTS_DIR = BASE_DIR / "reports"

# Ensure reports directory exists
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Model configuration (Crop Disease TFLite Model)
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(MODELS_DIR / "crop_disease_model.tflite")))
LABELS_PATH = Path(os.getenv("LABELS_PATH", str(MODELS_DIR / "class_names.json")))

# Pest Detection YOLO Model configuration
PEST_MODELS_DIR = MODELS_DIR / "IP102_Pest_Detection"
PEST_MODEL_PATH = Path(os.getenv("PEST_MODEL_PATH", str(PEST_MODELS_DIR / "best.pt")))
PEST_TAXONOMY_PATH = Path(os.getenv("PEST_TAXONOMY_PATH", str(PEST_MODELS_DIR / "ip102_classes.json")))
GUARD_MODEL_PATH = Path(os.getenv("GUARD_MODEL_PATH", str(MODELS_DIR / "yolo11n.pt" if (MODELS_DIR / "yolo11n.pt").exists() else BASE_DIR / "yolo11n.pt")))
PEST_GUARD_ENABLED = os.getenv("PEST_GUARD_ENABLED", "true").lower() in ("1", "true", "yes")
PEST_CONFIDENCE_THRESHOLD = float(os.getenv("PEST_CONFIDENCE_THRESHOLD", "0.15"))
PEST_IOU_THRESHOLD = float(os.getenv("PEST_IOU_THRESHOLD", "0.60"))
PEST_DEFAULT_IMGSZ = int(os.getenv("PEST_DEFAULT_IMGSZ", "1024"))

# Reporting & session limits
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))
REPORTED_VALIDATION_ACCURACY = 0.9554

# Nutrient Deficiency TFLite Model configuration
NUTRIENT_MODELS_DIR = MODELS_DIR / "nutrient_deficiency_model_all_files"
NUTRIENT_MODEL_PATH = Path(os.getenv("NUTRIENT_MODEL_PATH", str(NUTRIENT_MODELS_DIR / "nutrient_deficiency_model.tflite")))
NUTRIENT_LABELS_PATH = Path(os.getenv("NUTRIENT_LABELS_PATH", str(NUTRIENT_MODELS_DIR / "class_names.json")))
NUTRIENT_CONFIDENCE_THRESHOLD = float(os.getenv("NUTRIENT_CONFIDENCE_THRESHOLD", "0.50"))
NUTRIENT_REPORT_PATH = Path(os.getenv("NUTRIENT_REPORT_PATH", str(NUTRIENT_MODELS_DIR / "fine_tuned_classification_report.csv")))
NUTRIENT_TRAINING_LOG_PATH = Path(os.getenv("NUTRIENT_TRAINING_LOG_PATH", str(NUTRIENT_MODELS_DIR / "training_log.csv")))
NUTRIENT_CONFUSION_MATRIX_PATH = Path(os.getenv("NUTRIENT_CONFUSION_MATRIX_PATH", str(NUTRIENT_MODELS_DIR / "confusion_matrix.npy")))
NUTRIENT_MANIFEST_PATH = Path(os.getenv("NUTRIENT_MANIFEST_PATH", str(NUTRIENT_MODELS_DIR / "selected_dataset_manifest.csv")))
NUTRIENT_REPORTED_VAL_ACCURACY = 0.6667

# Crop Yield Random Forest Model configuration
CROP_YIELD_DIR = MODELS_DIR / "crop_yield_model"
CROP_YIELD_MODEL_PATH = Path(os.getenv("CROP_YIELD_MODEL_PATH", str(CROP_YIELD_DIR / "crop_yield_model.joblib")))
CROP_YIELD_INFO_PATH = Path(os.getenv("CROP_YIELD_INFO_PATH", str(CROP_YIELD_DIR / "model_info.json")))
CROP_YIELD_METADATA_PATH = Path(os.getenv("CROP_YIELD_METADATA_PATH", str(CROP_YIELD_DIR / "yield_metadata.json")))


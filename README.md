# Crop Disease, Pest, Nutrient Deficiency & Yield AI — Full-Stack 4-Model Platform

A full-stack machine learning testing, diagnostic, pest localization, and yield forecasting platform built for comprehensive agricultural decision support:
1. **Crop Disease Diagnosis**: On-device MobileNetV3 TensorFlow Lite model (`crop_disease_model.tflite`, 38 categories) with treatment advice and validation benchmarks on PlantVillage.
2. **Insect Pest Detection**: YOLO11n object detector (`models/IP102_Pest_Detection/best.pt`, 97 categories) with spatial bounding box localization and count extraction on the IP102 dataset benchmark.
3. **Nutrient Deficiency AI**: On-device MobileNetV3 TensorFlow Lite model (`models/nutrient_deficiency_model_all_files/nutrient_deficiency_model.tflite`, 36 categories) classifying single (N, K) and compound (N+K, K+Mg, N+Mg) nutrient deficiencies across 8 Indian gourd and vegetable crops with actionable foliar spray and organic fertilizer dosage prescriptions (OLID-I dataset).
4. **Crop Yield & Harvest Forecasting AI**: Random Forest Regressor Pipeline (`models/crop_yield_model/crop_yield_model.joblib`) predicting crop yields (Tonnes/Ha) and gross farm production (Tonnes & Quintals) across 632 Indian districts and 115 crops with 79.2% R² accuracy, crop simulation, and multi-field portfolio planning.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                  React + Vite Frontend (Port 5173)                     │
│  - Overview Dashboard            - Disease Detection Studio            │
│  - YOLO Pest Detection Studio    - Nutrient Deficiency Studio          │
│  - Crop Yield Forecasting Studio - Model Testing & Benchmark           │
│  - Quad-Model Specifications     - Diagnostic Treatment Prescriptions  │
│  - PlantVillage Dataset Explorer - Multi-Field Portfolio Planner       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / Multipart Uploads
┌───────────────────────────────────▼────────────────────────────────────┐
│                  FastAPI Python Backend (Port 8001)                    │
│  - /api/predict (MobileNetV3 TFLite Disease Classifier)                │
│  - /api/pest-detection/predict (YOLO11 Object Detector best.pt)        │
│  - /api/nutrient-deficiency/predict (MobileNetV3 Nutrient Classifier)  │
│  - /api/crop-yield/predict & /predict-batch (Random Forest Regressor)  │
│  - /api/crop-yield/categories, /presets & /simulate-scenarios          │
│  - /api/evaluate & /export (Scikit-Learn Metrics & ReportLab PDFs)     │
│  - /api/health (Quad-Model Readiness Monitoring)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┬──────────────────────────┐
         ▼                          ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ MobileNetV3 TFLite│      │ Ultralytics YOLO11│     │ MobileNetV3 TFLite│      │ RF Regressor     │
│ (Crop Disease)   │       │ (Pest Detection) │       │ (Nutrient AI)    │       │ (Yield AI)       │
│ [1, 224, 224, 3] │       │ [1, 3, 640, 640] │       │ [1, 224, 224, 3] │       │ 6 Features       │
│ Output: 38 Cls   │       │ Output: 97 Cls   │       │ Output: 36 Cls   │       │ Target: Yield    │
│ Size: 3.66 MB    │       │ Size: 5.28 MB    │       │ Size: 3.64 MB    │       │ Size: 44.66 MB   │
└──────────────────┘       └──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## Directory Structure

```text
CropDiseaseAI/
│
├── models/
│   ├── crop_disease_model.tflite     # Trained MobileNetV3 edge disease model (3.84 MB)
│   ├── class_names.json              # 38 PlantVillage classes in Keras sort order
│   ├── IP102_Pest_Detection/         # Trained YOLO11 Pest Detection model
│   │   ├── best.pt                   # Trained YOLO weights (5.28 MB)
│   │   └── ip102_classes.json        # 102 taxonomic IP102 class names
│   ├── nutrient_deficiency_model_all_files/ # Trained MobileNetV3 Nutrient model
│   │   ├── nutrient_deficiency_model.tflite # 36-class edge model (3.64 MB)
│   │   ├── best_nutrient_model.keras        # Keras checkpoint
│   │   ├── class_names.json                 # 36 OLID-I Indian crop deficiency classes
│   │   ├── classification_report.csv        # Validation classification metrics
│   │   ├── fine_tuned_classification_report.csv
│   │   ├── confusion_matrix.npy             # 36x36 confusion matrix
│   │   ├── selected_dataset_manifest.csv    # 3,480 image manifest across 8 crops
│   │   └── training_log.csv                 # 20-epoch training convergence log
│   └── crop_yield_model/             # Trained Random Forest Crop Yield Model
│       ├── crop_yield_model.joblib   # Scikit-Learn Pipeline (44.66 MB)
│       ├── model_info.json           # Model metadata and metrics
│       └── yield_metadata.json       # Categories, presets and top feature importances
│
├── test_images/                      # Isolated sample photographs for quick verification
│   ├── apple_scab_leaf.jpg
│   ├── tomato_early_blight_leaf.jpg
│   ├── pest_caterpillar.jpg
│   ├── nutrient_tomato_nitrogen.jpg
│   ├── nutrient_cucumber_potassium.jpg
│   └── nutrient_eggplant_healthy.jpg

│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI application & CORS config
│   │   ├── config.py                 # Paths, thresholds & hyperparameters
│   │   ├── model_loader.py           # Thread-safe TFLite interpreter singleton
│   │   ├── services/
│   │   │   └── pest_detection_service.py # Thread-safe YOLO11 inference service
│   │   ├── preprocessing.py          # RGB decoding & [0, 255] float32 normalizer
│   │   ├── inference.py              # Softmax transformation & top-5 ranker
│   │   ├── disease_info.py           # Agronomic symptoms & management advice
│   │   ├── evaluation.py             # Scikit-learn metrics & ReportLab PDF generator
│   │   ├── schemas.py                # Pydantic v2 typed models
│   │   └── routes/
│   │       ├── health.py
│   │       ├── predict.py
│   │       ├── pest_detection.py     # /api/pest-detection/predict & model-info
│   │       ├── evaluate.py
│   │       ├── dataset_info.py
│   │       └── history.py
│   ├── tests/
│   │   ├── test_api.py               # Automated pytest suite (6 tests passing)
│   │   └── test_pest_detection.py    # Automated pest detection tests (5 tests passing)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/               # Sidebar, Navbar, status badges
│   │   ├── pages/                    # 7 major dashboard views
│   │   ├── services/                 # Centralized fetch API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind CSS & custom styling
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── reports/                          # Saved evaluation JSONs and generated PDFs
├── scripts/
│   ├── inspect_dataset.py            # Image dataset integrity scanner
│   ├── extract_dataset.py            # Multi-archive unpacker
│   └── predict_crop_disease.py       # Standalone CLI prediction utility
└── README.md
```

---

## Prerequisites

1. **Python**: 3.10+ (Tested on Python 3.13.4 with TensorFlow 2.21.0)
2. **Node.js**: v18+ (Tested on Node.js v22.17.1 with npm 10.9.2)
3. **OS**: Windows 10/11 or Linux/macOS

---

## How to Run the Platform Locally

### Step 1: Start the FastAPI Backend

Open PowerShell in the project directory:

```powershell
cd C:\plant
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### Step 2: Start the React Frontend

Open a second PowerShell window:

```powershell
cd C:\plant\frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:5173/`**

---

## Core Features & Testing Workflows

### 1. Disease Detection Page
- Drag and drop or browse any crop leaf photo (`.jpg`, `.jpeg`, `.png`, `.webp`).
- Click **Analyze Leaf** to execute real TFLite inference.
- View predicted disease, top-5 ranked alternatives, inference latency (typically 5–15 ms), and agronomic management advice.
- Quick test buttons available for instant sample evaluation (Apple Scab, Tomato Early Blight).

### 2. Model Testing Studio
- **Automated Dataset Benchmark**: Runs controlled evaluations drawing samples across all 38 classes from the local PlantVillage split.
- **Multi-Image Batch Testing**: Upload up to 50 photos simultaneously to verify model stability and batch throughput.

### 3. Evaluation Reports
- Displays overall Accuracy, Macro Precision, Macro Recall, and Macro/Weighted F1-scores.
- Interactive **Per-Class F1-Score Bar Chart** powered by Recharts with crop-level filtering.
- Downloadable **PDF Evaluation Report** generated on-the-fly using ReportLab.
- Downloadable CSVs for raw classification reports and prediction histories.

### 4. PlantVillage Dataset Explorer
- Browse all **54,305 color leaf photographs** organized by their 38 disease categories across 14 crops.
- Live thumbnails and class distribution counters.

### 5. Model Architecture & Specifications
- Live tensor geometry: Input `[1, 224, 224, 3]`, Output `[1, 38]`.
- Input preprocessing: `[0.0, 255.0]` float32.
- Transparent disclosure of **Model Limitations** (laboratory background vs. uncontrolled field lighting).

---

## Automated Verification Tests

To re-run the backend test suite:

```powershell
python -m pytest backend/tests/test_api.py -v
```

**Results:**
- `test_root_endpoint`: PASSED
- `test_health_endpoint`: PASSED
- `test_model_info_endpoint`: PASSED
- `test_predict_real_image` (Apple Scab confidence >90%): PASSED
- `test_prediction_history`: PASSED
- `test_dataset_info` (38 classes): PASSED

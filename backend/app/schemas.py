from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str
    classes_count: int
    error: Optional[str] = None
    pest_model_loaded: Optional[bool] = False
    pest_model_path: Optional[str] = None
    pest_classes_count: Optional[int] = 0
    nutrient_model_loaded: Optional[bool] = False
    nutrient_model_path: Optional[str] = None
    nutrient_classes_count: Optional[int] = 0
    yield_model_loaded: Optional[bool] = False
    yield_model_path: Optional[str] = None
    yield_crops_count: Optional[int] = 0
    yield_districts_count: Optional[int] = 0
    market_price_loaded: Optional[bool] = True
    market_price_commodities_count: Optional[int] = 13

class ModelInfoResponse(BaseModel):
    model_name: str
    model_format: str
    model_size_mb: float
    input_shape: List[int]
    input_dtype: str
    output_shape: List[int]
    output_dtype: str
    num_classes: int
    class_names: List[str]
    reported_val_accuracy: float
    model_loaded: bool
    limitations: List[str]

class PredictionItem(BaseModel):
    class_name: str
    score: float
    percentage: float

class TreatmentInfo(BaseModel):
    crop: str
    disease: str
    is_healthy: bool
    symptoms: str
    management: List[str]

class PredictionResponse(BaseModel):
    id: str
    filename: str
    predicted_class: str
    confidence: float
    confidence_level: str  # High, Moderate, Low
    is_low_confidence: bool
    inference_time_ms: float
    timestamp: str
    top_predictions: List[PredictionItem]
    treatment: Optional[TreatmentInfo] = None
    ground_truth: Optional[str] = None
    is_correct: Optional[bool] = None

class DatasetClassInfo(BaseModel):
    name: str
    crop: str
    disease_status: str
    image_count: int
    sample_images: List[str]

class DatasetInfoResponse(BaseModel):
    dataset_name: str
    path: str
    total_images: int
    num_classes: int
    classes: List[DatasetClassInfo]
    crops_summary: Dict[str, int]

class EvaluationMetrics(BaseModel):
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    precision_weighted: float
    recall_weighted: float
    f1_weighted: float
    total_samples: int
    successful_predictions: int
    failed_predictions: int
    avg_inference_time_ms: float
    median_inference_time_ms: float
    confusion_matrix: List[List[int]]
    classes: List[str]
    classification_report: Dict[str, Any]
    evaluation_date: str
    model_name: str

class BatchPredictionResponse(BaseModel):
    total_images: int
    results: List[PredictionResponse]
    metrics: Optional[EvaluationMetrics] = None
    avg_inference_time_ms: float

# Pest Detection Schemas (YOLO11 IP102 Model)
class PestBBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float

class PestDetectionItem(BaseModel):
    class_id: int
    class_name: str
    display_name: str
    confidence: float
    confidence_percentage: float
    bbox: PestBBox
    crop_image: Optional[str] = None

class PestDetectionResponse(BaseModel):
    success: bool
    id: str
    filename: str
    model: str
    count: int
    detections: List[PestDetectionItem]
    image_width: int
    image_height: int
    confidence_threshold: float
    inference_time_ms: float
    annotated_image: Optional[str] = None
    imgsz: int = 1024
    augment: bool = False
    human_detected: Optional[bool] = False
    context_warning: Optional[str] = None
    filtered_count: Optional[int] = 0
    timestamp: str

class PestModelInfoResponse(BaseModel):
    model_name: str
    model_format: str
    model_size_mb: float
    task: str
    input_resolution: str
    num_classes: int
    class_names: Dict[int, str]
    model_loaded: bool
    load_error: Optional[str] = None
    train_metrics: Dict[str, Any]
    notes: List[str]

# Nutrient Deficiency Schemas (MobileNetV3 OLID-I Model)
class NutrientPredictionItem(BaseModel):
    class_name: str
    crop: str
    crop_display: str
    condition: str
    score: float
    percentage: float

class NutrientRemedyInfo(BaseModel):
    class_name: str
    crop_key: str
    crop_name: str
    condition_key: str
    deficiency_title: str
    nutrient_element: Optional[str] = None
    agronomic_clarification: Optional[str] = None
    is_healthy: bool
    severity: str
    nutrients_involved: List[str]
    primary_symptom: str
    physiological_role: str
    chemical_remedies: List[str]
    organic_remedies: List[str]
    prevention: List[str]

class NutrientPredictionResponse(BaseModel):
    id: str
    filename: str
    predicted_class: str
    crop: str
    crop_name: str
    condition: str
    deficiency_title: str
    nutrient_element: Optional[str] = None
    nutrient_note: Optional[str] = None
    crop_inferred_from: Optional[str] = "user_selection"
    nutrient_breakdown: Optional[Dict[str, float]] = None
    is_healthy: bool
    severity: str
    confidence: float
    confidence_level: str
    is_low_confidence: bool
    inference_time_ms: float
    timestamp: str
    top_predictions: List[NutrientPredictionItem]
    remedy: Optional[NutrientRemedyInfo] = None
    ground_truth: Optional[str] = None
    is_correct: Optional[bool] = None

class NutrientBatchPredictionResponse(BaseModel):
    total_images: int
    results: List[NutrientPredictionResponse]
    avg_inference_time_ms: float

class NutrientModelInfoResponse(BaseModel):
    model_name: str
    model_format: str
    architecture: str
    model_size_mb: float
    input_shape: List[int]
    input_dtype: str
    output_shape: List[int]
    output_dtype: str
    num_classes: int
    class_names: List[str]
    crops_covered: List[str]
    conditions_covered: List[str]
    reported_val_accuracy: float
    model_loaded: bool
    load_error: Optional[str] = None
    dataset_name: str
    classification_report: Dict[str, Any]
    training_history: List[Dict[str, Any]]
    manifest_summary: Dict[str, Any]
    notes: List[str]

# ============================================================================
# Crop Yield Prediction Schemas (Random Forest Regressor)
# ============================================================================

class CropYieldPredictRequest(BaseModel):
    state: str = Field(..., description="Indian State name")
    district: str = Field(..., description="District name")
    season: str = Field(..., description="Agricultural season (e.g., Kharif, Rabi, Whole Year)")
    crop: str = Field(..., description="Crop name (e.g., Rice, Wheat, Sugarcane)")
    crop_year: int = Field(2024, ge=1990, le=2035, description="Harvest year")
    area: float = Field(..., gt=0, description="Cultivated land area in Hectares")

class CropYieldPresetItem(BaseModel):
    id: str
    title: str
    state: str
    district: str
    season: str
    crop: str
    crop_year: int
    area: float
    description: str

class CropYieldFactor(BaseModel):
    factor: str
    impact: str
    description: str

class CropYieldPredictionResponse(BaseModel):
    id: str
    state: str
    district: str
    season: str
    crop: str
    crop_year: int
    area_hectares: float
    area_acres: float
    predicted_yield_per_hectare: float
    estimated_total_production_tonnes: float
    estimated_total_production_quintals: float
    yield_category: str  # High Yield, Moderate Yield, Low Yield
    confidence_metric: str
    agronomic_advisory: List[str]
    top_factors: List[CropYieldFactor]
    inference_time_ms: float
    timestamp: str

class CropYieldBatchItemRequest(BaseModel):
    plot_name: Optional[str] = "Plot"
    state: str
    district: str
    season: str
    crop: str
    crop_year: int = 2024
    area: float = Field(..., gt=0)

class CropYieldBatchPredictRequest(BaseModel):
    items: List[CropYieldBatchItemRequest]

class CropYieldBatchPredictResponse(BaseModel):
    total_plots: int
    total_area_hectares: float
    total_estimated_production_tonnes: float
    average_yield_per_hectare: float
    highest_yielding_plot: Optional[str] = None
    results: List[CropYieldPredictionResponse]
    avg_inference_time_ms: float

class CropYieldCategoriesResponse(BaseModel):
    states: List[str]
    districts: List[str]
    seasons: List[str]
    crops: List[str]
    states_count: int
    districts_count: int
    crops_count: int
    seasons_count: int
    presets: List[CropYieldPresetItem]
    state_districts: Optional[Dict[str, List[str]]] = None

class CropYieldModelInfoResponse(BaseModel):
    model_name: str
    algorithm: str
    target: str
    metrics: Dict[str, float]
    model_size_mb: float
    model_loaded: bool
    load_error: Optional[str] = None
    states_count: int
    districts_count: int
    crops_count: int
    seasons_count: int
    top_features: List[Dict[str, Any]]
    limitations: List[str]

# ============================================================================
# Market Price Prediction Schemas (Advanced AI Feature)
# ============================================================================

class MarketPricePredictRequest(BaseModel):
    commodity: str = Field(..., description="Crop or agricultural commodity name")
    state: Optional[str] = Field(None, description="Indian state name")
    mandi: Optional[str] = Field(None, description="Local APMC mandi or wholesale market")
    target_month: Optional[int] = Field(None, ge=1, le=12, description="Target forecast month (1-12)")
    crop_year: int = Field(2024, ge=2020, le=2030, description="Harvest/trading year")

class ForecastCurvePoint(BaseModel):
    month_num: int
    month: str
    predicted_price_quintal: float
    predicted_price_tonne: float
    msp_quintal: float
    min_price: float
    max_price: float
    is_current: bool

class MandiComparisonItem(BaseModel):
    mandi: str
    state: str
    price_quintal: float
    price_tonne: float
    difference_from_selected: float

class MarketPriceAdvisory(BaseModel):
    sell_strategy: str
    storage_viability: str
    market_outlook: str

class MarketPricePredictionResponse(BaseModel):
    id: str
    commodity: str
    category: str
    state: str
    mandi: str
    forecast_month: str
    forecast_year: int
    predicted_price_quintal: float
    predicted_price_tonne: float
    min_price_quintal: float
    max_price_quintal: float
    min_price_tonne: float
    max_price_tonne: float
    projected_retail_price_kg: float
    government_msp_quintal: float
    government_msp_tonne: float
    msp_premium_percent: float
    is_above_msp: bool
    market_trend: str
    trend_change_next_month_pct: float
    volatility_rating: str
    optimal_selling_window: str
    advisory: MarketPriceAdvisory
    forecast_curve: List[ForecastCurvePoint]
    mandi_comparisons: List[MandiComparisonItem]
    timestamp: str

class MarketPriceCommodityItem(BaseModel):
    commodity: str
    category: str
    primary_unit: str
    base_msp_tonne: float
    base_msp_quintal: float
    volatility: str
    default_state: str
    states: List[str]
    mandis: Dict[str, List[str]]

class MarketPriceCommoditiesResponse(BaseModel):
    total_commodities: int
    commodities: List[MarketPriceCommodityItem]
    categories: List[str]



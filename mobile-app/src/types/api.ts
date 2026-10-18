// TypeScript API Type Definitions for CropAI Ecosystem

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_path?: string;
  classes_count?: number;
  error?: string | null;
  pest_model_loaded?: boolean;
  pest_model_path?: string | null;
  pest_classes_count?: number;
  nutrient_model_loaded?: boolean;
  nutrient_model_path?: string | null;
  nutrient_classes_count?: number;
  yield_model_loaded?: boolean;
  yield_model_path?: string | null;
  yield_crops_count?: number;
  yield_districts_count?: number;
  market_price_loaded?: boolean;
  market_price_commodities_count?: number;
}

// 1. Disease Detection Types
export interface PredictionItem {
  class_name: string;
  score: number;
  percentage: number;
}

export interface TreatmentInfo {
  crop: string;
  disease: string;
  is_healthy: boolean;
  symptoms: string;
  management: string[];
}

export interface PredictionResponse {
  id: string;
  filename: string;
  predicted_class: string;
  confidence: number;
  confidence_level: 'High' | 'Moderate' | 'Low' | string;
  is_low_confidence: boolean;
  inference_time_ms: number;
  timestamp: string;
  top_predictions: PredictionItem[];
  treatment?: TreatmentInfo;
}

// 2. Pest Detection Types
export interface PestBBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface PestDetectionItem {
  class_id: number;
  class_name: string;
  display_name: string;
  confidence: number;
  confidence_percentage: number;
  bbox: PestBBox;
  crop_image?: string | null;
}

export interface PestDetectionResponse {
  success: boolean;
  id: string;
  filename: string;
  model: string;
  count: number;
  detections: PestDetectionItem[];
  image_width: number;
  image_height: number;
  confidence_threshold: number;
  inference_time_ms: number;
  annotated_image?: string | null;
  timestamp: string;
}

// 3. Nutrient Deficiency Types
export interface NutrientPredictionItem {
  class_name: string;
  crop: string;
  crop_display: string;
  condition: string;
  score: number;
  percentage: number;
}

export interface NutrientRemedyInfo {
  class_name: string;
  crop_name: string;
  deficiency_title: string;
  nutrient_element?: string | null;
  is_healthy: boolean;
  severity: string;
  nutrients_involved: string[];
  primary_symptom: string;
  physiological_role: string;
  chemical_remedies: string[];
  organic_remedies: string[];
  prevention: string[];
}

export interface NutrientPredictionResponse {
  id: string;
  filename: string;
  predicted_class: string;
  crop: string;
  crop_name: string;
  condition: string;
  deficiency_title: string;
  nutrient_element?: string | null;
  is_healthy: boolean;
  severity: string;
  confidence: number;
  confidence_level: string;
  is_low_confidence: boolean;
  inference_time_ms: number;
  timestamp: string;
  top_predictions: NutrientPredictionItem[];
  remedy?: NutrientRemedyInfo;
}

// 4. Crop Yield Prediction Types
export interface CropYieldPredictRequest {
  state: string;
  district: string;
  season: string;
  crop: string;
  crop_year?: number;
  area: number;
}

export interface CropYieldFactor {
  factor: string;
  impact: string;
  description: string;
}

export interface CropYieldPredictionResponse {
  id: string;
  state: string;
  district: string;
  season: string;
  crop: string;
  crop_year: number;
  area_hectares: number;
  area_acres: number;
  predicted_yield_per_hectare: number;
  estimated_total_production_tonnes: number;
  estimated_total_production_quintals: number;
  yield_category: string;
  confidence_metric: string;
  agronomic_advisory: string[];
  top_factors: CropYieldFactor[];
  inference_time_ms: number;
  timestamp: string;
}

export interface CropYieldCategoriesResponse {
  states: string[];
  districts: string[];
  seasons: string[];
  crops: string[];
  states_count: number;
  districts_count: number;
  crops_count: number;
  seasons_count: number;
  state_districts?: Record<string, string[]>;
}

// 5. Market Price Prediction Types
export interface MarketPriceCommodity {
  name: string;
  variety: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  unit: string;
  state: string;
  market: string;
  forecast_trend?: 'up' | 'down' | 'stable';
  change_pct?: number;
}

import logging
import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone

# Scikit-learn compatibility shim for pickled ColumnTransformer
class _RemainderColsList(list):
    """Compatibility shim for unpickling models saved with earlier scikit-learn versions."""
    pass

try:
    import sklearn.compose._column_transformer
    if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
        sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList
except Exception:
    pass

import joblib
import pandas as pd
import numpy as np

from ..config import (
    CROP_YIELD_MODEL_PATH,
    CROP_YIELD_INFO_PATH,
    CROP_YIELD_METADATA_PATH
)

logger = logging.getLogger(__name__)

# Curated agronomic recommendations mapped by crop type
AGRONOMIC_ADVISORY = {
    "sugarcane": [
        "Implement wide-row planting (4-5 ft) with trash mulching to conserve root zone moisture.",
        "Apply balanced N-P-K (250:115:115 kg/ha) with nitrogen split across 4 growth stages.",
        "Maintain drip fertigation during grand growth phase to optimize cane girth and sucrose accumulation."
    ],
    "rice": [
        "Adopt Alternate Wetting and Drying (AWD) irrigation to reduce water consumption by 25-30%.",
        "Top-dress urea in 3 equal splits: basal, active tillering, and panicle initiation.",
        "Apply Zinc Sulfate (25 kg/ha) to prevent Khaira disease and boost grain filling."
    ],
    "wheat": [
        "Ensure critical first irrigation at Crown Root Initiation (CRI) stage (20-25 days after sowing).",
        "Apply potassium and zinc to enhance grain resistance against terminal heat stress.",
        "Monitor for rust and blight during late vegetative and heading stages."
    ],
    "potato": [
        "Perform ridge earthening at 30-35 days to shield developing tubers from direct sunlight and greening.",
        "Ensure adequate potassium supply (Potassium Sulfate preferred) for uniform tuber sizing and dry matter content.",
        "Spray prophylactic fungicides during overcast humid weather to mitigate early and late blight."
    ],
    "cotton": [
        "Deploy pheromone traps (5 traps/ha) for early bollworm monitoring and integrated pest management.",
        "Foliar spray of 1% KNO3 during peak flowering and boll development to prevent premature senescence.",
        "Avoid waterlogging; maintain furrow drainage during monsoon heavy downpours."
    ],
    "maize": [
        "Keep field weed-free during the critical first 30-40 days post-emergence using pre-emergence herbicides.",
        "Ensure non-stress moisture availability during knee-high, tasseling, and silking phases.",
        "Apply secondary and micronutrients (S, Zn) based on regional soil test recommendations."
    ],
    "coconut": [
        "Apply organic farmyard manure (50 kg/palm) in circular basins along with recommended NPK dose.",
        "Maintain green manuring and coir pith mulching around the basin to sustain high moisture retention.",
        "Periodically scout for rhinoceros beetle and red palm weevil infestations."
    ]
}

DEFAULT_ADVISORY = [
    "Conduct regular soil testing to calibrate macro and micronutrient application to exact plot conditions.",
    "Adopt micro-irrigation (drip/sprinkler) to optimize water productivity and fertilizer delivery.",
    "Practice crop rotation with short-duration leguminous pulses to regenerate soil organic nitrogen."
]


class CropYieldService:
    def __init__(
        self,
        model_path: Path = CROP_YIELD_MODEL_PATH,
        info_path: Path = CROP_YIELD_INFO_PATH,
        metadata_path: Path = CROP_YIELD_METADATA_PATH
    ):
        self.model_path = model_path
        self.info_path = info_path
        self.metadata_path = metadata_path
        self.pipeline = None
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.metadata: Dict[str, Any] = {}
        self.states: List[str] = []
        self.districts: List[str] = []
        self.seasons: List[str] = []
        self.crops: List[str] = []
        self.top_features: List[Dict[str, Any]] = []
        self.presets: List[Dict[str, Any]] = []
        self.metrics: Dict[str, float] = {}
        self.state_districts: Dict[str, List[str]] = {}

        self._load_model_and_metadata()

    def _load_model_and_metadata(self):
        """Loads the pre-trained scikit-learn Pipeline and metadata."""
        try:
            if not self.model_path.exists():
                self.load_error = f"Model artifact not found at: {self.model_path}"
                logger.warning(self.load_error)
                return

            logger.info("Loading Crop Yield Random Forest Pipeline from: %s", self.model_path)
            self.pipeline = joblib.load(self.model_path)

            # Apply runtime patch for SimpleImputer instances in pipeline if needed
            self._patch_imputer_attributes()

            # Load or extract metadata
            self._init_metadata()

            self.is_loaded = True
            logger.info(
                "Crop Yield Model loaded successfully. Covered: %d states, %d districts, %d crops, %d seasons.",
                len(self.states), len(self.districts), len(self.crops), len(self.seasons)
            )

        except Exception as e:
            self.load_error = str(e)
            logger.error("Failed to load Crop Yield Model: %s", e, exc_info=True)

    def _patch_imputer_attributes(self):
        """Ensures SimpleImputer instances have _fill_dtype for newer scikit-learn versions."""
        if hasattr(self.pipeline, "named_steps") and "preprocessor" in self.pipeline.named_steps:
            pre = self.pipeline.named_steps["preprocessor"]
            if hasattr(pre, "named_transformers_"):
                for name, step in pre.named_transformers_.items():
                    if hasattr(step, "named_steps"):
                        for sname, sstep in step.named_steps.items():
                            if hasattr(sstep, "_fit_dtype") and not hasattr(sstep, "_fill_dtype"):
                                sstep._fill_dtype = sstep._fit_dtype

    def _init_metadata(self):
        """Initializes categories, metrics, and feature importances."""
        # 1. Try reading from yield_metadata.json
        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.states = self.metadata.get("states", [])
                    self.districts = self.metadata.get("districts", [])
                    self.seasons = self.metadata.get("seasons", [])
                    self.crops = self.metadata.get("crops", [])
                    self.top_features = self.metadata.get("top_features", [])
                    self.presets = self.metadata.get("presets", [])
                    self.metrics = self.metadata.get("metrics", {})
                    self.state_districts = self.metadata.get("state_districts", {})
            except Exception as e:
                logger.warning("Error reading yield_metadata.json: %s", e)

        # Fallback to state_districts.json if not present in metadata
        if not self.state_districts:
            sd_file = self.metadata_path.parent / "state_districts.json"
            if sd_file.exists():
                try:
                    with open(sd_file, "r", encoding="utf-8") as f:
                        self.state_districts = json.load(f)
                except Exception as e:
                    logger.warning("Error reading state_districts.json: %s", e)

        # 2. Read base metrics from model_info.json if available
        if self.info_path.exists() and not self.metrics:
            try:
                with open(self.info_path, "r", encoding="utf-8") as f:
                    info = json.load(f)
                    self.metrics = info.get("metrics", {})
            except Exception as e:
                logger.warning("Error reading model_info.json: %s", e)

        # 3. Fallback extraction from Pipeline transformers directly
        if not self.states and self.pipeline is not None:
            try:
                pre = self.pipeline.named_steps.get("preprocessor")
                cat = pre.named_transformers_["categorical"].named_steps["onehot"]
                self.states = sorted([str(s).strip() for s in cat.categories_[0]])
                self.districts = sorted([str(d).strip() for d in cat.categories_[1]])
                self.seasons = sorted([str(s).strip() for s in cat.categories_[2]])
                self.crops = sorted([str(c).strip() for c in cat.categories_[3]])
            except Exception as e:
                logger.error("Failed to inspect pipeline categories: %s", e)

    def _match_category(self, user_val: str, category_list: List[str]) -> str:
        """Finds closest matching category name (case-insensitive fallback)."""
        val_clean = user_val.strip()
        # Exact match
        if val_clean in category_list:
            return val_clean
        # Case-insensitive match
        val_lower = val_clean.lower()
        for item in category_list:
            if item.lower() == val_lower:
                return item
        # Return user value as-is (pipeline OneHotEncoder has handle_unknown='ignore')
        return val_clean

    def predict(
        self,
        state: str,
        district: str,
        season: str,
        crop: str,
        crop_year: int,
        area: float
    ) -> Dict[str, Any]:
        """
        Executes crop yield prediction for a single agricultural plot.
        Returns predicted yield per hectare, total harvest, quintals, and advisory.
        """
        if not self.is_loaded or self.pipeline is None:
            raise RuntimeError(f"Crop Yield Model is not loaded: {self.load_error}")

        if area <= 0:
            raise ValueError("Cultivated land area must be greater than zero.")

        matched_state = self._match_category(state, self.states)
        matched_district = self._match_category(district, self.districts)
        matched_season = self._match_category(season, self.seasons)
        matched_crop = self._match_category(crop, self.crops)

        # Construct input DataFrame matching pipeline expectation
        input_df = pd.DataFrame([{
            "State_Name": matched_state,
            "District_Name": matched_district,
            "Season": matched_season,
            "Crop": matched_crop,
            "Crop_Year": int(crop_year),
            "Area": float(area)
        }])

        start_time = time.perf_counter()
        raw_pred = self.pipeline.predict(input_df)
        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        predicted_yield = max(0.0, float(raw_pred[0]))
        total_production = round(predicted_yield * float(area), 2)
        total_quintals = round(total_production * 10.0, 2)
        area_acres = round(float(area) * 2.47105, 2)

        # Determine yield category based on crop and value
        yield_cat = self._determine_yield_category(matched_crop, predicted_yield)

        # Agronomic advisory
        crop_key = matched_crop.lower().split("/")[0].split("(")[0].strip()
        advisory = AGRONOMIC_ADVISORY.get(crop_key, DEFAULT_ADVISORY)

        # Top contributing factors
        factors = [
            {
                "factor": "Crop Selection",
                "impact": f"Primary driver ({matched_crop})",
                "description": f"{matched_crop} genetic productivity profile in {matched_season} conditions."
            },
            {
                "factor": "Geographic Agro-Climatic Zone",
                "impact": f"{matched_district}, {matched_state}",
                "description": "Historical regional soil composition, precipitation regime, and drainage baseline."
            },
            {
                "factor": "Cultivation Scale",
                "impact": f"{area:.1f} Hectares ({area_acres:.1f} Acres)",
                "description": f"Overall yield calculated to yield {total_production:.2f} Tonnes total output."
            }
        ]

        prediction_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        return {
            "id": prediction_id,
            "state": matched_state,
            "district": matched_district,
            "season": matched_season,
            "crop": matched_crop,
            "crop_year": int(crop_year),
            "area_hectares": float(area),
            "area_acres": area_acres,
            "predicted_yield_per_hectare": round(predicted_yield, 3),
            "estimated_total_production_tonnes": total_production,
            "estimated_total_production_quintals": total_quintals,
            "yield_category": yield_cat,
            "confidence_metric": "R² = 0.792 (Random Forest Model)",
            "agronomic_advisory": advisory,
            "top_factors": factors,
            "inference_time_ms": inference_time_ms,
            "timestamp": timestamp
        }

    def _determine_yield_category(self, crop: str, val: float) -> str:
        """Categorizes yield into High, Moderate, or Standard."""
        crop_low = crop.lower()
        if "sugar" in crop_low:
            if val > 65.0: return "High Yield"
            if val > 40.0: return "Moderate Yield"
            return "Standard / Low Yield"
        elif "potato" in crop_low or "banana" in crop_low:
            if val > 22.0: return "High Yield"
            if val > 12.0: return "Moderate Yield"
            return "Standard Yield"
        elif "rice" in crop_low or "paddy" in crop_low or "wheat" in crop_low:
            if val > 3.5: return "High Yield"
            if val > 2.0: return "Moderate Yield"
            return "Standard Yield"
        elif "cotton" in crop_low:
            if val > 1.8: return "High Yield"
            if val > 0.8: return "Moderate Yield"
            return "Standard Yield"
        else:
            if val > 10.0: return "High Yield"
            if val > 3.0: return "Moderate Yield"
            return "Standard Yield"

    def predict_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Runs predictions for a collection of agricultural plots."""
        if not items:
            raise ValueError("Items list cannot be empty for batch prediction.")

        results = []
        total_production = 0.0
        total_area = 0.0
        highest_plot = None
        max_yield = -1.0
        times = []

        for item in items:
            plot_name = item.get("plot_name") or f"Plot {len(results)+1}"
            res = self.predict(
                state=item["state"],
                district=item["district"],
                season=item["season"],
                crop=item["crop"],
                crop_year=item.get("crop_year", 2024),
                area=float(item["area"])
            )
            res["plot_name"] = plot_name
            results.append(res)
            total_production += res["estimated_total_production_tonnes"]
            total_area += res["area_hectares"]
            times.append(res["inference_time_ms"])

            if res["predicted_yield_per_hectare"] > max_yield:
                max_yield = res["predicted_yield_per_hectare"]
                highest_plot = f"{plot_name} ({res['crop']} - {max_yield:.2f} T/Ha)"

        avg_yield = round(total_production / total_area, 3) if total_area > 0 else 0.0
        avg_time = round(sum(times) / len(times), 2) if times else 0.0

        return {
            "total_plots": len(results),
            "total_area_hectares": round(total_area, 2),
            "total_estimated_production_tonnes": round(total_production, 2),
            "average_yield_per_hectare": avg_yield,
            "highest_yielding_plot": highest_plot,
            "results": results,
            "avg_inference_time_ms": avg_time
        }

    def simulate_scenarios(self, state: str, district: str, area: float, crop_year: int = 2024) -> List[Dict[str, Any]]:
        """
        Simulates yield across prominent crops for the same land parcel
        to assist in agricultural crop planning and comparative analysis.
        """
        candidate_crops = [
            ("Sugarcane", "Whole Year"),
            ("Rice", "Kharif"),
            ("Wheat", "Rabi"),
            ("Maize", "Kharif"),
            ("Potato", "Rabi"),
            ("Cotton(lint)", "Kharif")
        ]
        scenarios = []
        for crop_name, season in candidate_crops:
            if crop_name in self.crops or any(c.lower().startswith(crop_name.lower()) for c in self.crops):
                try:
                    res = self.predict(
                        state=state,
                        district=district,
                        season=season,
                        crop=crop_name,
                        crop_year=crop_year,
                        area=area
                    )
                    scenarios.append({
                        "crop": crop_name,
                        "season": season,
                        "yield_per_hectare": res["predicted_yield_per_hectare"],
                        "total_tonnes": res["estimated_total_production_tonnes"],
                        "yield_category": res["yield_category"]
                    })
                except Exception:
                    continue
        return sorted(scenarios, key=lambda s: s["yield_per_hectare"], reverse=True)

    def get_categories(self) -> Dict[str, Any]:
        """Returns all selectable states, districts, seasons, crops, and curated presets."""
        return {
            "states": self.states,
            "districts": self.districts,
            "seasons": self.seasons,
            "crops": self.crops,
            "states_count": len(self.states),
            "districts_count": len(self.districts),
            "crops_count": len(self.crops),
            "seasons_count": len(self.seasons),
            "presets": self.presets,
            "state_districts": self.state_districts
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Returns technical specifications, metrics, and feature importances."""
        file_size_mb = 0.0
        if self.model_path.exists():
            file_size_mb = round(self.model_path.stat().st_size / (1024 * 1024), 2)

        return {
            "model_name": "Crop Yield Prediction Model",
            "algorithm": "Random Forest Regressor (100 Trees, max_depth=20)",
            "target": "Yield (Tonnes per Hectare)",
            "metrics": self.metrics or {
                "MAE": 14.2503,
                "RMSE": 307.7464,
                "R2": 0.7921
            },
            "model_size_mb": file_size_mb,
            "model_loaded": self.is_loaded,
            "load_error": self.load_error,
            "states_count": len(self.states),
            "districts_count": len(self.districts),
            "crops_count": len(self.crops),
            "seasons_count": len(self.seasons),
            "top_features": self.top_features,
            "limitations": [
                "Predictions reflect historical agricultural census and survey distributions.",
                "Unforeseen extreme weather events (e.g. unseasonal hailstorms, flash floods) may affect actual yields.",
                "Yield targets assume standard agronomic practices and pest/disease control."
            ]
        }


# Singleton service instance
yield_service = CropYieldService()

import csv
import io
import json
import logging
import threading
import time
import uuid
import gc
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
from PIL import Image

# Multi-backend LiteRT / TFLite interpreter loader
Interpreter = None
try:
    from ai_edge_litert.interpreter import Interpreter
except ImportError:
    try:
        import tflite_runtime.interpreter as _tflite
        Interpreter = _tflite.Interpreter
    except ImportError:
        try:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter
        except ImportError:
            Interpreter = None

from ..config import (
    NUTRIENT_MODEL_PATH,
    NUTRIENT_LABELS_PATH,
    NUTRIENT_CONFIDENCE_THRESHOLD,
    NUTRIENT_REPORT_PATH,
    NUTRIENT_TRAINING_LOG_PATH,
    NUTRIENT_CONFUSION_MATRIX_PATH,
    NUTRIENT_MANIFEST_PATH,
    NUTRIENT_REPORTED_VAL_ACCURACY
)
from ..nutrient_info import get_nutrient_deficiency_info, CROP_NAMES_MAP

logger = logging.getLogger(__name__)

class NutrientDeficiencyService:
    """
    Singleton service for the MobileNetV3 Nutrient Deficiency model.
    Classifies 36 categories of nitrogen, potassium, magnesium, and healthy conditions
    across 8 Indian vegetable and gourd crops from the OLID-I dataset.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(NutrientDeficiencyService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.model_path = NUTRIENT_MODEL_PATH
        self.labels_path = NUTRIENT_LABELS_PATH
        self.interpreter: Optional[Any] = None
        self.input_details: List[Dict[str, Any]] = []
        self.output_details: List[Dict[str, Any]] = []
        self.class_names: List[str] = []
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.inference_lock = threading.Lock()

        # Cached metrics and metadata
        self.classification_report: Dict[str, Any] = {}
        self.training_log: List[Dict[str, Any]] = []
        self.manifest_summary: Dict[str, Any] = {}

        # Preload labels (tiny JSON)
        if self.labels_path.exists():
            try:
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    self.class_names = json.load(f)
            except Exception as e:
                logger.warning("Failed to load nutrient labels: %s", e)

        self._load_reports_and_metadata()
        self._initialized = True

    def ensure_loaded(self) -> bool:
        if self.is_loaded and self.interpreter is not None:
            return True
        return self.load_model()

    def load_model(self) -> bool:
        with self.inference_lock:
            if self.is_loaded and self.interpreter is not None:
                return True
            try:
                if not self.model_path.exists():
                    raise FileNotFoundError(f"Nutrient TFLite model not found at: {self.model_path}")

                if not self.class_names and self.labels_path.exists():
                    with open(self.labels_path, "r", encoding="utf-8") as f:
                        self.class_names = json.load(f)

                if Interpreter is None:
                    raise ImportError("No LiteRT, tflite-runtime, or TensorFlow runtime installed.")

                self.interpreter = Interpreter(model_path=str(self.model_path))
                self.interpreter.allocate_tensors()

                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                self.is_loaded = True
                self.load_error = None
                gc.collect()
                logger.info("Nutrient Deficiency model loaded successfully (%d classes)", len(self.class_names))
                return True
            except Exception as e:
                self.is_loaded = False
                self.load_error = str(e)
                logger.error("Failed to load Nutrient model: %s", e)
                return False


    def _load_reports_and_metadata(self):
        """Loads precomputed classification report, training log, and dataset manifest."""
        # Load classification report CSV
        if NUTRIENT_REPORT_PATH.exists():
            try:
                report_dict = {}
                with open(NUTRIENT_REPORT_PATH, mode="r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    header = next(reader, None)
                    for row in reader:
                        if not row or len(row) < 5:
                            continue
                        name = row[0].strip()
                        if not name:
                            continue
                        try:
                            prec = float(row[1])
                            rec = float(row[2])
                            f1 = float(row[3])
                            supp = float(row[4])
                            report_dict[name] = {
                                "precision": round(prec, 4),
                                "recall": round(rec, 4),
                                "f1_score": round(f1, 4),
                                "support": int(supp) if supp.is_integer() else supp
                            }
                        except ValueError:
                            continue
                self.classification_report = report_dict
            except Exception as e:
                logger.warning("Could not parse nutrient classification report: %s", e)

        # Load training log CSV
        if NUTRIENT_TRAINING_LOG_PATH.exists():
            try:
                logs = []
                with open(NUTRIENT_TRAINING_LOG_PATH, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        try:
                            logs.append({
                                "epoch": int(row.get("epoch", 0)) + 1,
                                "accuracy": round(float(row.get("accuracy", 0)), 4),
                                "loss": round(float(row.get("loss", 0)), 4),
                                "val_accuracy": round(float(row.get("val_accuracy", 0)), 4),
                                "val_loss": round(float(row.get("val_loss", 0)), 4),
                                "learning_rate": float(row.get("learning_rate", 0))
                            })
                        except ValueError:
                            continue
                self.training_log = logs
            except Exception as e:
                logger.warning("Could not parse nutrient training log: %s", e)

        # Load dataset manifest summary
        if NUTRIENT_MANIFEST_PATH.exists():
            try:
                crop_counts: Dict[str, int] = {}
                condition_counts: Dict[str, int] = {}
                total_samples = 0
                with open(NUTRIENT_MANIFEST_PATH, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        total_samples += 1
                        c = row.get("crop", "unknown").strip()
                        cond = row.get("condition", "unknown").strip()
                        crop_counts[c] = crop_counts.get(c, 0) + 1
                        condition_counts[cond] = condition_counts.get(cond, 0) + 1

                self.manifest_summary = {
                    "total_samples": total_samples,
                    "crop_distribution": crop_counts,
                    "condition_distribution": condition_counts
                }
            except Exception as e:
                logger.warning("Could not parse nutrient dataset manifest: %s", e)

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Decodes image bytes and converts to 224x224 RGB float32 array in [0, 255]."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image format: {e}")

        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize to 224x224
        target_size = (224, 224)
        if self.input_details:
            shape = self.input_details[0]["shape"]
            target_size = (int(shape[2]), int(shape[1]))

        image = image.resize(target_size, Image.Resampling.BILINEAR)
        input_data = np.asarray(image, dtype=np.float32)
        input_data = np.expand_dims(input_data, axis=0)
        return input_data

    def infer_crop(
        self,
        image_bytes: bytes,
        filename: str = "",
        crop_hint: Optional[str] = None
    ) -> Tuple[Optional[str], str]:
        """
        Determines the crop context using:
        1. User explicit selection (if provided and not 'all')
        2. Filename keyword deduction
        3. PlantVillage disease model heuristic for Solanaceae (tomato, pepper/eggplant)
        """
        if crop_hint and crop_hint.lower() != "all":
            return crop_hint.lower().strip(), "user_selection"

        # Check filename keywords
        fn = filename.lower()
        keyword_map = {
            "tomato": "tomato",
            "cucumber": "cucumber",
            "eggplant": "eggplant",
            "brinjal": "eggplant",
            "bitter": "bitter_gourd",
            "bottle": "bottle_gourd",
            "ash": "ash_gourd",
            "ridge": "ridge_gourd",
            "snake": "snake_gourd",
        }
        for kw, crop_key in keyword_map.items():
            if kw in fn:
                return crop_key, "filename_deduction"

        # Check PlantVillage disease model if loaded
        try:
            from ..model_loader import model_manager
            from ..preprocessing import preprocess_image
            if model_manager.is_loaded and model_manager.interpreter:
                prep = preprocess_image(image_bytes)
                with model_manager.inference_lock:
                    model_manager.interpreter.set_tensor(model_manager.input_details[0]["index"], prep)
                    model_manager.interpreter.invoke()
                    d_out = model_manager.interpreter.get_tensor(model_manager.output_details[0]["index"])[0]
                best_i = int(np.argmax(d_out))
                score = float(d_out[best_i])
                pred_c = model_manager.class_names[best_i].lower()
                if score >= 0.25:
                    if "tomato" in pred_c:
                        return "tomato", "disease_model_heuristic"
                    if "pepper" in pred_c:
                        return "eggplant", "disease_model_heuristic"
                    if "potato" in pred_c:
                        return "tomato", "disease_model_heuristic"
        except Exception as e:
            logger.debug("Crop inference via disease model failed: %s", e)

        return None, "unconstrained_all"

    def predict(
        self,
        image_bytes: bytes,
        filename: str = "leaf_sample.jpg",
        ground_truth: Optional[str] = None,
        threshold: float = NUTRIENT_CONFIDENCE_THRESHOLD,
        crop_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs inference on single leaf image bytes for nutrient deficiency classification.
        """
        self.ensure_loaded()
        if not self.is_loaded or not self.interpreter:
            raise RuntimeError(f"Nutrient Deficiency model is not loaded: {self.load_error}")

        input_data = self.preprocess_image(image_bytes)
        input_idx = self.input_details[0]["index"]
        output_idx = self.output_details[0]["index"]

        t0 = time.perf_counter()
        with self.inference_lock:
            self.interpreter.set_tensor(input_idx, input_data)
            self.interpreter.invoke()
            raw_output = self.interpreter.get_tensor(output_idx)[0]
        inference_time_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Apply softmax if needed using pure numpy
        if not np.isclose(np.sum(raw_output), 1.0, atol=0.05):
            shift = raw_output - np.max(raw_output)
            exps = np.exp(shift)
            probs = exps / np.sum(exps)
        else:
            probs = raw_output

        # Determine effective crop hint via selection, filename, or disease model heuristic
        effective_crop, crop_inferred_from = self.infer_crop(image_bytes, filename, crop_hint)

        # Crop-aware distribution filtering
        filtered_probs = probs.copy()
        if effective_crop:
            mask = np.array([effective_crop in c.lower() for c in self.class_names], dtype=bool)
            if np.any(mask):
                filtered_probs = np.where(mask, filtered_probs, 0.0)
                norm = np.sum(filtered_probs)
                if norm > 0:
                    filtered_probs = filtered_probs / norm

        top_indices = np.argsort(filtered_probs)[::-1][:5]
        top_predictions = []

        for idx in top_indices:
            idx_int = int(idx)
            c_name = self.class_names[idx_int] if idx_int < len(self.class_names) else f"Class_{idx_int}"
            score_val = float(filtered_probs[idx_int])
            parts = c_name.split("__") if "__" in c_name else [c_name, "unknown"]
            top_predictions.append({
                "class_name": c_name,
                "crop": parts[0],
                "crop_display": CROP_NAMES_MAP.get(parts[0], parts[0].replace("_", " ").title()),
                "condition": parts[1] if len(parts) > 1 else parts[0],
                "score": round(score_val, 4),
                "percentage": round(score_val * 100, 2)
            })

        best_idx = int(top_indices[0])
        predicted_class = self.class_names[best_idx] if best_idx < len(self.class_names) else f"Class_{best_idx}"
        confidence = float(filtered_probs[best_idx])

        # Confidence category
        if confidence >= 0.80:
            confidence_level = "High"
        elif confidence >= threshold:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"

        is_low_confidence = confidence < threshold

        # Fetch detailed symptoms and remedies
        remedy_info = get_nutrient_deficiency_info(predicted_class)

        # Compute multi-class nutrient breakdown across all classes
        n_sum = 0.0
        k_sum = 0.0
        mg_sum = 0.0
        healthy_sum = 0.0
        for i, c_name in enumerate(self.class_names):
            p_val = float(probs[i])
            if "__" in c_name:
                _, cond = c_name.split("__", 1)
            else:
                cond = c_name

            if cond == "healthy":
                healthy_sum += p_val
            elif cond == "N":
                n_sum += p_val
            elif cond == "K":
                k_sum += p_val
            elif cond == "N_K":
                n_sum += p_val * 0.5
                k_sum += p_val * 0.5
            elif cond == "K_Mg":
                k_sum += p_val * 0.5
                mg_sum += p_val * 0.5
            elif cond == "N_Mg":
                n_sum += p_val * 0.5
                mg_sum += p_val * 0.5

        tot = n_sum + k_sum + mg_sum + healthy_sum
        if tot > 0:
            nutrient_breakdown = {
                "nitrogen_n": round((n_sum / tot) * 100, 1),
                "potassium_k": round((k_sum / tot) * 100, 1),
                "magnesium_mg": round((mg_sum / tot) * 100, 1),
                "healthy_balance": round((healthy_sum / tot) * 100, 1)
            }
        else:
            nutrient_breakdown = {
                "nitrogen_n": 0.0,
                "potassium_k": 0.0,
                "magnesium_mg": 0.0,
                "healthy_balance": 0.0
            }

        nutrient_note = (
            "Agricultural Element: Potassium (K) from N-P-K fertilizer. "
            "Note: In crop science, 'K' designates elemental Potassium (Kalium), not human Vitamin K. "
            "Plants do not experience Vitamin K deficiency."
        ) if "K" in remedy_info.get("condition_key", "") else None

        is_correct = None
        if ground_truth:
            is_correct = (predicted_class.strip().lower() == ground_truth.strip().lower())

        return {
            "id": str(uuid.uuid4()),
            "filename": filename,
            "predicted_class": predicted_class,
            "crop": remedy_info["crop_key"],
            "crop_name": remedy_info["crop_name"],
            "condition": remedy_info["condition_key"],
            "deficiency_title": remedy_info["deficiency_title"],
            "nutrient_element": remedy_info.get("nutrient_element", "General Nutrition"),
            "nutrient_note": nutrient_note,
            "crop_inferred_from": crop_inferred_from,
            "nutrient_breakdown": nutrient_breakdown,
            "is_healthy": remedy_info["is_healthy"],
            "severity": remedy_info["severity"],
            "confidence": round(confidence, 4),
            "confidence_level": confidence_level,
            "is_low_confidence": is_low_confidence,
            "inference_time_ms": inference_time_ms,
            "timestamp": datetime.now().isoformat(),
            "top_predictions": top_predictions,
            "remedy": remedy_info,
            "ground_truth": ground_truth,
            "is_correct": is_correct
        }

    def get_model_info(self) -> Dict[str, Any]:
        size_mb = round(self.model_path.stat().st_size / (1024 * 1024), 2) if self.model_path.exists() else 0.0

        inp_shape = [int(x) for x in self.input_details[0]["shape"]] if self.input_details else [1, 224, 224, 3]
        out_shape = [int(x) for x in self.output_details[0]["shape"]] if self.output_details else [1, len(self.class_names)]

        return {
            "model_name": self.model_path.name if self.model_path else "nutrient_deficiency_model.tflite",
            "model_format": "TensorFlow Lite (.tflite)",
            "architecture": "MobileNetV3Small (Crop-Aware Nutrient Classifier)",
            "model_size_mb": size_mb,
            "input_shape": inp_shape,
            "input_dtype": "float32",
            "output_shape": out_shape,
            "output_dtype": "float32",
            "num_classes": len(self.class_names),
            "class_names": self.class_names,
            "crops_covered": list(CROP_NAMES_MAP.keys()),
            "conditions_covered": ["N", "K", "N_K", "K_Mg", "N_Mg", "healthy"],
            "reported_val_accuracy": NUTRIENT_REPORTED_VAL_ACCURACY,
            "model_loaded": self.is_loaded,
            "load_error": self.load_error,
            "dataset_name": "OLID-I (Open Leaf Image Dataset - Indian Crops)",
            "classification_report": self.classification_report,
            "training_history": self.training_log,
            "manifest_summary": self.manifest_summary,
            "notes": [
                "Trained on 3,480 annotated field leaf specimens across 8 Indian vegetables.",
                "Distinguishes single deficiencies (N, K), double deficiencies (N+K, K+Mg, N+Mg), and healthy leaves.",
                "Optimized for real-time mobile and edge CPU inference via lightweight MobileNetV3Small quantization."
            ]
        }

    def get_classes(self) -> Dict[str, Any]:
        """Returns classes grouped by crop and deficiency condition."""
        grouped_by_crop: Dict[str, List[str]] = {}
        grouped_by_condition: Dict[str, List[str]] = {}

        for c_name in self.class_names:
            if "__" in c_name:
                crop, cond = c_name.split("__", 1)
            else:
                crop, cond = c_name, "general"

            if crop not in grouped_by_crop:
                grouped_by_crop[crop] = []
            grouped_by_crop[crop].append(c_name)

            if cond not in grouped_by_condition:
                grouped_by_condition[cond] = []
            grouped_by_condition[cond].append(c_name)

        return {
            "num_classes": len(self.class_names),
            "classes": self.class_names,
            "by_crop": grouped_by_crop,
            "by_condition": grouped_by_condition,
            "crop_names": CROP_NAMES_MAP
        }

nutrient_service = NutrientDeficiencyService()

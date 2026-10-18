import json
import logging
import threading
import gc
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

# Multi-backend LiteRT / TFLite interpreter loader
Interpreter = None
try:
    from ai_edge_litert.interpreter import Interpreter
    logger_msg = "Using Google ai-edge-litert runtime."
except ImportError:
    try:
        import tflite_runtime.interpreter as _tflite
        Interpreter = _tflite.Interpreter
        logger_msg = "Using tflite-runtime."
    except ImportError:
        try:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter
            logger_msg = "Using TensorFlow tf.lite fallback."
        except ImportError:
            Interpreter = None
            logger_msg = "No TFLite or LiteRT runtime available."

from .config import MODEL_PATH, LABELS_PATH, REPORTED_VALIDATION_ACCURACY

logger = logging.getLogger(__name__)
logger.info("Crop Disease Model Loader: %s", logger_msg)

class TFLiteModelManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(TFLiteModelManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.model_path = MODEL_PATH
        self.labels_path = LABELS_PATH
        self.interpreter: Optional[Any] = None
        self.input_details: List[Dict[str, Any]] = []
        self.output_details: List[Dict[str, Any]] = []
        self.class_names: List[str] = []
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.inference_lock = threading.Lock()
        
        # Preload class names (tiny JSON, <1 KB)
        if self.labels_path.exists():
            try:
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    self.class_names = json.load(f)
            except Exception as e:
                logger.warning("Failed to load class names: %s", e)

        self._initialized = True

    def ensure_loaded(self) -> bool:
        """Thread-safe lazy loading mechanism."""
        if self.is_loaded and self.interpreter is not None:
            return True
        return self.load_model()

    def load_model(self) -> bool:
        with self.inference_lock:
            if self.is_loaded and self.interpreter is not None:
                return True
            try:
                if not self.model_path.exists():
                    raise FileNotFoundError(f"TFLite model file not found at: {self.model_path}")
                
                # Load Class Names if not already cached
                if not self.class_names and self.labels_path.exists():
                    with open(self.labels_path, "r", encoding="utf-8") as f:
                        self.class_names = json.load(f)

                if Interpreter is None:
                    raise ImportError("No LiteRT or TensorFlow runtime installed.")

                # Initialize lightweight TFLite Interpreter
                self.interpreter = Interpreter(model_path=str(self.model_path))
                self.interpreter.allocate_tensors()
                
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                self.is_loaded = True
                self.load_error = None
                gc.collect()
                logger.info("Crop Disease model loaded successfully from %s (%d classes)", self.model_path.name, len(self.class_names))
                return True
                
            except Exception as e:
                self.is_loaded = False
                self.load_error = str(e)
                logger.error("Failed to load TFLite model: %s", e)
                return False

    def get_model_info(self) -> Dict[str, Any]:
        self.ensure_loaded()
        if not self.is_loaded or not self.interpreter:
            return {
                "model_name": self.model_path.name if self.model_path else "unknown",
                "model_format": "TensorFlow Lite (.tflite)",
                "model_size_mb": round(self.model_path.stat().st_size / (1024 * 1024), 2) if self.model_path.exists() else 0.0,
                "input_shape": [1, 224, 224, 3],
                "input_dtype": "float32",
                "output_shape": [1, len(self.class_names) or 38],
                "output_dtype": "float32",
                "num_classes": len(self.class_names),
                "class_names": self.class_names,
                "reported_val_accuracy": REPORTED_VALIDATION_ACCURACY,
                "model_loaded": self.is_loaded,
                "limitations": [
                    "Model trained under controlled laboratory conditions (PlantVillage benchmark).",
                    "Performance on diverse uncontrolled field photos may differ from test benchmark.",
                    "Classifier only supports the 38 explicitly trained disease/healthy categories."
                ]
            }

        inp = self.input_details[0]
        out = self.output_details[0]
        size_mb = round(self.model_path.stat().st_size / (1024 * 1024), 2)
        
        return {
            "model_name": self.model_path.name,
            "model_format": "TensorFlow Lite (.tflite)",
            "model_size_mb": size_mb,
            "input_shape": [int(x) for x in inp["shape"]],
            "input_dtype": str(np.dtype(inp["dtype"]).name),
            "output_shape": [int(x) for x in out["shape"]],
            "output_dtype": str(np.dtype(out["dtype"]).name),
            "num_classes": len(self.class_names),
            "class_names": self.class_names,
            "reported_val_accuracy": REPORTED_VALIDATION_ACCURACY,
            "model_loaded": True,
            "limitations": [
                "Dataset images were collected under uniform backgrounds (PlantVillage protocol).",
                "Field clutter, extreme shadows, and multiple leaves may require segmentation or re-framing.",
                "Predictions indicate visual similarity and statistical model scoring, not certified agricultural guarantee."
            ]
        }

model_manager = TFLiteModelManager()

import json
import logging
import threading
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import tensorflow as tf

from .config import MODEL_PATH, LABELS_PATH, REPORTED_VALIDATION_ACCURACY

logger = logging.getLogger(__name__)

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
        self.interpreter: Optional[tf.lite.Interpreter] = None
        self.input_details: List[Dict[str, Any]] = []
        self.output_details: List[Dict[str, Any]] = []
        self.class_names: List[str] = []
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.inference_lock = threading.Lock()
        
        self.load_model()
        self._initialized = True

    def load_model(self) -> bool:
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"TFLite model file not found at: {self.model_path}")
            
            # Load Class Names
            if self.labels_path.exists():
                with open(self.labels_path, "r", encoding="utf-8") as f:
                    self.class_names = json.load(f)
            else:
                raise FileNotFoundError(f"Class labels not found at: {self.labels_path}")

            # Initialize TFLite Interpreter
            self.interpreter = tf.lite.Interpreter(model_path=str(self.model_path))
            self.interpreter.allocate_tensors()
            
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            self.is_loaded = True
            self.load_error = None
            logger.info("TFLite model loaded successfully from %s", self.model_path)
            return True
            
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error("Failed to load TFLite model: %s", e)
            return False

    def get_model_info(self) -> Dict[str, Any]:
        if not self.is_loaded or not self.interpreter:
            return {
                "model_name": self.model_path.name if self.model_path else "unknown",
                "model_format": "TensorFlow Lite (.tflite)",
                "model_size_mb": round(self.model_path.stat().st_size / (1024 * 1024), 2) if self.model_path.exists() else 0.0,
                "input_shape": [],
                "input_dtype": "unknown",
                "output_shape": [],
                "output_dtype": "unknown",
                "num_classes": len(self.class_names),
                "class_names": self.class_names,
                "reported_val_accuracy": REPORTED_VALIDATION_ACCURACY,
                "model_loaded": False,
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

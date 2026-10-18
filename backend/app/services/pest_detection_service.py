import io
import json
import base64
import time
import uuid
import logging
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageOps
import numpy as np
import cv2

from ..config import (
    PEST_MODEL_PATH, 
    PEST_TAXONOMY_PATH, 
    GUARD_MODEL_PATH,
    PEST_GUARD_ENABLED,
    PEST_CONFIDENCE_THRESHOLD, 
    PEST_IOU_THRESHOLD,
    PEST_DEFAULT_IMGSZ
)

logger = logging.getLogger(__name__)

class PestDetectionService:
    """
    Singleton service for YOLO11 Pest Detection model (best.pt)
    with integrated out-of-domain / human false positive guard filter.
    Loads the trained model once and provides thread-safe inference,
    bounding box extraction, and filtered annotated visualization.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PestDetectionService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.model_path = PEST_MODEL_PATH
        self.taxonomy_path = PEST_TAXONOMY_PATH
        self.guard_model_path = GUARD_MODEL_PATH
        self.guard_enabled = PEST_GUARD_ENABLED
        self.model = None
        self.guard_model = None
        self.guard_loaded: bool = False
        self.class_names: Dict[int, str] = {}
        self.taxonomy_map: Dict[int, str] = {}
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.inference_lock = threading.Lock()
        self.train_metrics: Dict[str, Any] = {}

        self._load_taxonomy()
        # Models will be lazily loaded on first request to preserve RAM
        self._initialized = True

    def ensure_loaded(self) -> bool:
        if self.is_loaded and self.model is not None:
            return True
        return self.load_model()

    def _load_taxonomy(self):
        """Loads optional IP102 human-readable taxonomy names if available."""
        if self.taxonomy_path.exists():
            try:
                with open(self.taxonomy_path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    # Convert string keys to int
                    self.taxonomy_map = {int(k): str(v) for k, v in raw_data.items()}
                logger.info("Loaded IP102 taxonomy: %d names", len(self.taxonomy_map))
            except Exception as e:
                logger.warning("Failed to parse IP102 taxonomy JSON: %s", e)

    def load_model(self) -> bool:
        """Loads best.pt using Ultralytics YOLO with memory constraints."""
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Pest detection model weights not found at: {self.model_path}. "
                    "Please verify best.pt is located in models/IP102_Pest_Detection/."
                )

            # Lazy import ultralytics & torch with single-threaded execution to conserve memory
            from ultralytics import YOLO
            import torch
            import gc
            torch.set_num_threads(1)
            torch.set_grad_enabled(False)

            logger.info("Loading YOLO Pest Detection model from %s...", self.model_path)
            self.model = YOLO(str(self.model_path))

            # Read actual class names directly from the model metadata
            raw_names = getattr(self.model, "names", None)
            if not raw_names and hasattr(self.model, "model") and hasattr(self.model.model, "names"):
                raw_names = self.model.model.names

            if isinstance(raw_names, dict):
                self.class_names = {int(k): str(v) for k, v in raw_names.items()}
            elif isinstance(raw_names, (list, tuple)):
                self.class_names = {i: str(name) for i, name in enumerate(raw_names)}
            else:
                self.class_names = {}

            self.is_loaded = True
            self.load_error = None
            gc.collect()
            logger.info("YOLO Pest Detection model loaded successfully (%d classes).", len(self.class_names))
            return True

        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error("Failed to load YOLO Pest Detection model: %s", e)
            return False

    def load_guard_model(self) -> bool:
        """Loads lightweight YOLO11n model for human / out-of-domain false positive suppression."""
        if not self.guard_enabled:
            return False
        try:
            from ultralytics import YOLO
            if not self.guard_model_path.exists():
                logger.warning(
                    "Guard model weights not found at %s. Out-of-domain filtering will be skipped.", 
                    self.guard_model_path
                )
                return False
            logger.info("Loading YOLO Out-of-Domain Guard model from %s...", self.guard_model_path)
            self.guard_model = YOLO(str(self.guard_model_path))
            self.guard_loaded = True
            logger.info("YOLO Guard model loaded successfully.")
            return True
        except Exception as e:
            self.guard_loaded = False
            logger.warning("Failed to load YOLO Guard model: %s", e)
            return False

    def draw_annotated_image(self, image: Image.Image, detections: List[Dict[str, Any]]) -> Optional[str]:
        """
        Renders high-contrast bounding boxes and label badges ONLY for confirmed,
        non-suppressed pest detections.
        """
        try:
            img_np = np.array(image)
            bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            for det in detections:
                bbox = det["bbox"]
                x1, y1 = max(0, int(round(bbox["x1"]))), max(0, int(round(bbox["y1"])))
                x2, y2 = min(bgr.shape[1], int(round(bbox["x2"]))), min(bgr.shape[0], int(round(bbox["y2"])))

                # Draw high-visibility emerald green bounding box
                box_color = (60, 185, 40)   # BGR vibrant green
                cv2.rectangle(bgr, (x1, y1), (x2, y2), box_color, 2)

                # Label text
                label = f"{det['display_name']} ({det['confidence_percentage']:.0f}%)"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.5
                thickness = 1
                (tw, th), baseline = cv2.getTextSize(label, font, font_scale, thickness)

                # Badge background pill
                badge_y1 = max(0, y1 - th - baseline - 6)
                badge_y2 = y1
                badge_x2 = min(bgr.shape[1], x1 + tw + 8)
                cv2.rectangle(bgr, (x1, badge_y1), (badge_x2, badge_y2), (20, 110, 20), -1)
                cv2.putText(
                    bgr, 
                    label, 
                    (x1 + 4, badge_y2 - baseline - 2), 
                    font, 
                    font_scale, 
                    (255, 255, 255), 
                    thickness, 
                    cv2.LINE_AA
                )

            success, encoded_buf = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            if success:
                b64_str = base64.b64encode(encoded_buf.tobytes()).decode("utf-8")
                return f"data:image/jpeg;base64,{b64_str}"
        except Exception as e:
            logger.warning("Failed to render custom annotated visualization: %s", e)
        return None

    def get_display_name(self, class_id: int, class_name: str) -> str:
        """
        Maps model internal class name to human-readable pest name
        while always preserving the model's actual class name.
        """
        # In IP102, class names might be "0" to "101"
        try:
            idx = int(class_name)
            # Check 1-indexed taxonomy mapping
            if (idx + 1) in self.taxonomy_map:
                tax_name = self.taxonomy_map[idx + 1]
                return f"Pest #{class_name}: {tax_name.title()}"
            elif idx in self.taxonomy_map:
                tax_name = self.taxonomy_map[idx]
                return f"Pest #{class_name}: {tax_name.title()}"
        except ValueError:
            pass

        return f"Pest Class {class_name}"

    def get_model_info(self) -> Dict[str, Any]:
        """Returns structured metadata about the YOLO pest detection model."""
        size_mb = round(self.model_path.stat().st_size / (1024 * 1024), 2) if self.model_path.exists() else 0.0

        if not self.is_loaded or self.model is None:
            return {
                "model_name": self.model_path.name if self.model_path else "best.pt",
                "model_format": "PyTorch / Ultralytics YOLO11n (.pt)",
                "model_size_mb": size_mb,
                "task": "detect",
                "input_resolution": "640x640 RGB",
                "num_classes": len(self.class_names),
                "class_names": self.class_names,
                "model_loaded": False,
                "load_error": self.load_error,
                "train_metrics": self.train_metrics,
                "notes": [
                    "Model trained using IP102 Pest Detection dataset with YOLO11n backbone.",
                    "Provides real-time bounding box localization and multi-pest detection."
                ]
            }

        return {
            "model_name": self.model_path.name,
            "model_format": "PyTorch / Ultralytics YOLO11n (.pt)",
            "model_size_mb": size_mb,
            "task": getattr(self.model, "task", "detect"),
            "input_resolution": "640x640 RGB",
            "num_classes": len(self.class_names),
            "class_names": self.class_names,
            "model_loaded": True,
            "train_metrics": {
                "precision": round(float(self.train_metrics.get("metrics/precision(B)", 0.5355)), 4),
                "recall": round(float(self.train_metrics.get("metrics/recall(B)", 0.6004)), 4),
                "map50": round(float(self.train_metrics.get("metrics/mAP50(B)", 0.5967)), 4),
                "map50_95": round(float(self.train_metrics.get("metrics/mAP50-95(B)", 0.3887)), 4),
            },
            "notes": [
                "Trained for 50 epochs on IP102 Agricultural Pest dataset.",
                "Backbone architecture: Ultralytics YOLO11n (Nano) optimized for edge and CPU inference.",
                "Detects bounding boxes, pest species category IDs, and confidence probabilities."
            ]
        }

    def predict(
        self,
        image_bytes: bytes,
        filename: str = "upload.jpg",
        confidence_threshold: float = PEST_CONFIDENCE_THRESHOLD,
        iou_threshold: float = PEST_IOU_THRESHOLD,
        imgsz: int = PEST_DEFAULT_IMGSZ,
        augment: bool = False
    ) -> Dict[str, Any]:
        """
        Runs YOLO pest detection on image_bytes with multi-scale resolution,
        TTA augmentation option, and cropped insect thumbnails.
        """
        if not self.is_loaded or self.model is None:
            # Try to load if not loaded yet
            if not self.load_model():
                raise RuntimeError(
                    f"Pest detection model is not available: {self.load_error or 'Weights could not be loaded'}"
                )

        # Validate and open image using PIL
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            # Reopen and automatically transpose mobile EXIF orientation
            image = Image.open(io.BytesIO(image_bytes))
            image = ImageOps.exif_transpose(image).convert("RGB")
        except Exception as e:
            raise ValueError(f"Corrupted or invalid image data: {str(e)}")

        orig_w, orig_h = image.size

        # Clamp thresholds and image sizes
        conf = max(0.01, min(float(confidence_threshold), 0.99))
        iou = max(0.10, min(float(iou_threshold), 0.99))
        
        # Round imgsz to multiple of 32 between 320 and 1536
        target_imgsz = max(320, min(int(imgsz), 1536))
        target_imgsz = int(round(target_imgsz / 32) * 32)

        # Guard Check: Detect human / person presence using lightweight YOLO COCO model
        human_detected = False
        is_human_dominant = False
        human_boxes = []
        total_human_area = 0.0
        max_human_conf = 0.0

        if self.guard_enabled:
            if not self.guard_loaded:
                self.load_guard_model()
            if self.guard_model is not None:
                try:
                    with self.inference_lock:
                        guard_res = self.guard_model.predict(
                            source=image,
                            classes=[0],  # COCO class 0 = 'person'
                            conf=0.20,
                            imgsz=640,
                            device="cpu",
                            verbose=False
                        )
                    if guard_res and len(guard_res[0].boxes) > 0:
                        human_detected = True
                        for b in guard_res[0].boxes:
                            bx = b.xyxy[0].tolist()
                            hconf = float(b.conf[0])
                            human_boxes.append((bx, hconf))
                            b_area = max(0.0, bx[2] - bx[0]) * max(0.0, bx[3] - bx[1])
                            total_human_area += b_area
                            if hconf > max_human_conf:
                                max_human_conf = hconf

                        frame_area = float(orig_w * orig_h)
                        human_ratio = total_human_area / frame_area if frame_area > 0 else 0.0
                        # Dominant if person occupies >= 20% of frame with good confidence, or high confidence portrait
                        is_human_dominant = (
                            (human_ratio >= 0.20 and max_human_conf >= 0.35) or
                            (max_human_conf >= 0.60 and human_ratio >= 0.15)
                        )
                except Exception as ge:
                    logger.warning("Guard model inference failed: %s", ge)

        # Thread-safe YOLO pest inference with configured resolution and TTA
        t0 = time.perf_counter()
        with self.inference_lock:
            results = self.model.predict(
                source=image,
                conf=conf,
                iou=iou,
                imgsz=target_imgsz,
                augment=bool(augment),
                agnostic_nms=False,
                device="cpu",
                verbose=False
            )
        inference_time_ms = round((time.perf_counter() - t0) * 1000, 2)

        detections: List[Dict[str, Any]] = []
        suppressed_count = 0

        if results and len(results) > 0:
            res = results[0]
            boxes = res.boxes

            if boxes is not None and len(boxes) > 0:
                xyxy_list = boxes.xyxy.cpu().numpy()
                conf_list = boxes.conf.cpu().numpy()
                cls_list = boxes.cls.cpu().numpy()

                for i in range(len(boxes)):
                    b = xyxy_list[i]
                    c_id = int(cls_list[i])
                    c_score = float(conf_list[i])

                    # Clamp bounding box coords to image boundaries
                    x1 = max(0.0, min(float(b[0]), float(orig_w)))
                    y1 = max(0.0, min(float(b[1]), float(orig_h)))
                    x2 = max(0.0, min(float(b[2]), float(orig_w)))
                    y2 = max(0.0, min(float(b[3]), float(orig_h)))
                    p_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)

                    # Check for human / out-of-domain overlap
                    is_human_overlap = False
                    for (hx1, hy1, hx2, hy2), hconf in human_boxes:
                        # 15% margin padding around person bounding box
                        pad_w = (hx2 - hx1) * 0.15
                        pad_h = (hy2 - hy1) * 0.15
                        ehx1 = max(0.0, hx1 - pad_w)
                        ehy1 = max(0.0, hy1 - pad_h)
                        ehx2 = min(float(orig_w), hx2 + pad_w)
                        ehy2 = min(float(orig_h), hy2 + pad_h)

                        ix1, iy1 = max(x1, ehx1), max(y1, ehy1)
                        ix2, iy2 = min(x2, ehx2), min(y2, ehy2)
                        iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
                        inter = iw * ih

                        if p_area > 0 and (inter / p_area) >= 0.15:
                            is_human_overlap = True
                            break

                    # If candidate overlaps with a person, or the entire scene is a human portrait/selfie, suppress
                    if is_human_overlap or is_human_dominant:
                        suppressed_count += 1
                        continue

                    # Confirmed valid agricultural pest detection
                    c_name = self.class_names.get(c_id, str(c_id))
                    display_name = self.get_display_name(c_id, c_name)

                    # Generate high-resolution cropped thumbnail for this pest
                    crop_b64 = None
                    try:
                        pad_x = max(10, int((x2 - x1) * 0.15))
                        pad_y = max(10, int((y2 - y1) * 0.15))
                        crop_box = (
                            max(0, int(x1 - pad_x)),
                            max(0, int(y1 - pad_y)),
                            min(orig_w, int(x2 + pad_x)),
                            min(orig_h, int(y2 + pad_y))
                        )
                        if crop_box[2] > crop_box[0] and crop_box[3] > crop_box[1]:
                            cropped_pest = image.crop(crop_box)
                            crop_buf = io.BytesIO()
                            cropped_pest.save(crop_buf, format="JPEG", quality=90)
                            crop_b64 = f"data:image/jpeg;base64,{base64.b64encode(crop_buf.getvalue()).decode('utf-8')}"
                    except Exception as e:
                        logger.debug("Failed to crop insect thumbnail: %s", e)

                    detections.append({
                        "class_id": c_id,
                        "class_name": c_name,
                        "display_name": display_name,
                        "confidence": round(c_score, 4),
                        "confidence_percentage": round(c_score * 100, 2),
                        "bbox": {
                            "x1": round(x1, 1),
                            "y1": round(y1, 1),
                            "x2": round(x2, 1),
                            "y2": round(y2, 1),
                            "width": round(x2 - x1, 1),
                            "height": round(y2 - y1, 1)
                        },
                        "crop_image": crop_b64
                    })

        # Draw bounding boxes ONLY for confirmed detections (zero suppressed boxes shown)
        annotated_b64 = None
        if len(detections) > 0:
            annotated_b64 = self.draw_annotated_image(image, detections)

        context_warning = None
        if human_detected and suppressed_count > 0:
            context_warning = (
                f"Human subject detected: Out-of-domain filter suppressed {suppressed_count} false detection(s) "
                "on human features/clothing. Detections are restricted to agricultural crop pests only."
            )
        elif human_detected and is_human_dominant:
            context_warning = (
                "Human subject detected: The pest model is specialized for agricultural crop foliage and field insects."
            )

        return {
            "success": True,
            "id": str(uuid.uuid4()),
            "filename": filename,
            "model": "IP102_YOLO11n_Pest_Detection",
            "count": len(detections),
            "detections": detections,
            "image_width": orig_w,
            "image_height": orig_h,
            "confidence_threshold": conf,
            "imgsz": target_imgsz,
            "augment": bool(augment),
            "inference_time_ms": inference_time_ms,
            "annotated_image": annotated_b64,
            "human_detected": human_detected,
            "context_warning": context_warning,
            "filtered_count": suppressed_count,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
        }

# Global singleton instance
pest_service = PestDetectionService()

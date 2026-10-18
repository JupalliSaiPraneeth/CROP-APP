import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import numpy as np
import tensorflow as tf

from .model_loader import model_manager
from .preprocessing import preprocess_image
from .disease_info import get_disease_info
from .config import CONFIDENCE_THRESHOLD

def run_single_inference(image_bytes: bytes, filename: str = "upload.jpg", ground_truth: Optional[str] = None, threshold: float = CONFIDENCE_THRESHOLD) -> Dict[str, Any]:
    if not model_manager.is_loaded or not model_manager.interpreter:
        raise RuntimeError(f"TFLite model is not loaded: {model_manager.load_error}")

    input_details = model_manager.input_details[0]
    output_details = model_manager.output_details[0]

    shape = input_details["shape"]
    target_size = (int(shape[2]), int(shape[1])) # (width, height)
    input_dtype = input_details["dtype"]
    quant_params = input_details.get("quantization", (0.0, 0))

    # Preprocess
    input_tensor = preprocess_image(
        image_bytes=image_bytes,
        target_size=target_size,
        input_dtype=input_dtype,
        quantization_params=quant_params
    )

    # Thread-safe execution
    t0 = time.perf_counter()
    with model_manager.inference_lock:
        model_manager.interpreter.set_tensor(input_details["index"], input_tensor)
        model_manager.interpreter.invoke()
        raw_output = model_manager.interpreter.get_tensor(output_details["index"])[0]
    inference_time_ms = round((time.perf_counter() - t0) * 1000, 2)

    # De-quantize if necessary
    output_scale, output_zero = output_details.get("quantization", (0.0, 0))
    if output_details["dtype"] in (np.uint8, np.int8) and output_scale > 0:
        raw_output = (raw_output.astype(np.float32) - output_zero) * output_scale

    # Softmax conversion if values are raw logits
    if not np.isclose(np.sum(raw_output), 1.0, atol=0.05):
        probs = tf.nn.softmax(raw_output).numpy()
    else:
        probs = raw_output

    class_names = model_manager.class_names
    top_indices = np.argsort(probs)[::-1][:5]

    top_predictions = []
    for idx in top_indices:
        idx_int = int(idx)
        c_name = class_names[idx_int] if idx_int < len(class_names) else f"Class_{idx_int}"
        score_val = float(probs[idx_int])
        top_predictions.append({
            "class_name": c_name,
            "score": round(score_val, 4),
            "percentage": round(score_val * 100, 2)
        })

    best_idx = int(top_indices[0])
    predicted_class = class_names[best_idx] if best_idx < len(class_names) else f"Class_{best_idx}"
    confidence = float(probs[best_idx])
    
    # Confidence category
    if confidence >= 0.85:
        confidence_level = "High"
    elif confidence >= threshold:
        confidence_level = "Moderate"
    else:
        confidence_level = "Low"

    is_low_confidence = confidence < threshold

    # Treatment and Domain Info
    treatment_data = get_disease_info(predicted_class)

    is_correct = None
    if ground_truth:
        is_correct = (predicted_class.strip().lower() == ground_truth.strip().lower())

    return {
        "id": str(uuid.uuid4()),
        "filename": filename,
        "predicted_class": predicted_class,
        "confidence": round(confidence, 4),
        "confidence_level": confidence_level,
        "is_low_confidence": is_low_confidence,
        "inference_time_ms": inference_time_ms,
        "timestamp": datetime.now().isoformat(),
        "top_predictions": top_predictions,
        "treatment": treatment_data,
        "ground_truth": ground_truth,
        "is_correct": is_correct
    }

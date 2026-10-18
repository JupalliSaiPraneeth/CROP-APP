import io
from typing import Tuple
import numpy as np
from PIL import Image

def preprocess_image(image_bytes: bytes, target_size: Tuple[int, int] = (224, 224), input_dtype=np.float32, quantization_params=(0.0, 0)) -> np.ndarray:
    """
    Safely decodes and prepares an uploaded image bytes buffer for MobileNetV3 TFLite inference.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image format: {e}")

    # Convert to RGB (dropping Alpha channels or Grayscale safely)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Resize to model input dimensions (Bilinear interpolation)
    width, height = target_size
    image = image.resize((width, height), Image.Resampling.BILINEAR)

    # Convert to NumPy float32 array in [0, 255] range as verified for this model
    input_data = np.asarray(image, dtype=np.float32)
    input_data = np.expand_dims(input_data, axis=0)

    # Handle Quantized models (INT8 / UINT8) if ever deployed with quantization
    if input_dtype in (np.uint8, np.int8):
        scale, zero_point = quantization_params
        if scale > 0:
            input_data = np.round(input_data / scale + zero_point)
        limits = np.iinfo(input_dtype)
        input_data = np.clip(input_data, limits.min, limits.max)
        input_data = input_data.astype(input_dtype)
    else:
        input_data = input_data.astype(np.float32)

    return input_data

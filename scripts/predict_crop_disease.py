import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image


# Project paths
PROJECT_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = PROJECT_DIR / "models" / "crop_disease_model.tflite"

# Update this path if your class_names.json is stored elsewhere.
LABELS_PATH = PROJECT_DIR / "models" / "class_names.json"


def predict(image_path):
    # Check required files
    if not MODEL_PATH.exists():
        print(f"Model not found: {MODEL_PATH}")
        return

    if not LABELS_PATH.exists():
        print(f"Class labels not found: {LABELS_PATH}")
        print("You need the class_names.json file from your training.")
        return

    image_path = Path(image_path)

    if not image_path.exists():
        print(f"Image not found: {image_path}")
        return

    # Load class names
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    # Load TensorFlow Lite model
    interpreter = tf.lite.Interpreter(model_path=str(MODEL_PATH))
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Get expected input dimensions
    shape = input_details[0]["shape"]
    height, width = int(shape[1]), int(shape[2])

    # Read image
    image = Image.open(image_path).convert("RGB")
    image = image.resize((width, height))

    # Prepare image tensor
    input_data = np.asarray(image, dtype=np.float32)
    input_data = np.expand_dims(input_data, axis=0)

    # Handle models with quantized inputs
    input_dtype = input_details[0]["dtype"]

    if input_dtype == np.uint8 or input_dtype == np.int8:
        scale, zero_point = input_details[0]["quantization"]

        if scale > 0:
            input_data = np.round(input_data / scale + zero_point)

        limits = np.iinfo(input_dtype)
        input_data = np.clip(input_data, limits.min, limits.max)

    input_data = input_data.astype(input_dtype)

    # Run prediction
    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()

    predictions = interpreter.get_tensor(output_details[0]["index"])[0]

    # Convert quantized output if necessary
    output_scale, output_zero_point = output_details[0]["quantization"]

    if output_details[0]["dtype"] in (np.uint8, np.int8) and output_scale > 0:
        predictions = (
            predictions.astype(np.float32) - output_zero_point
        ) * output_scale

    # The model may output logits rather than probabilities.
    # Confirm the output activation used during training if values
    # do not look like probabilities.
    if not np.isclose(np.sum(predictions), 1.0, atol=0.05):
        predictions = tf.nn.softmax(predictions).numpy()

    predicted_index = int(np.argmax(predictions))

    if predicted_index >= len(class_names):
        print("Error: model output count does not match class labels.")
        return

    predicted_label = class_names[predicted_index]
    confidence = float(predictions[predicted_index]) * 100

    print("\n--- Crop Disease Prediction ---")
    print(f"Image: {image_path.name}")
    print(f"Prediction: {predicted_label}")
    print(f"Model score: {confidence:.2f}%")
    print("\nTop predictions:")

    top_indices = np.argsort(predictions)[::-1][:5]

    for index in top_indices:
        if index < len(class_names):
            print(
                f"{class_names[index]}: "
                f"{float(predictions[index]) * 100:.2f}%"
            )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            'Usage: python scripts/predict_crop_disease.py '
            '"path/to/leaf_image.jpg"'
        )
    else:
        predict(sys.argv[1])

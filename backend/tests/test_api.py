import os
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["model_loaded"] is True

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["classes_count"] == 38

def test_model_info_endpoint():
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["num_classes"] == 38
    assert data["model_format"] == "TensorFlow Lite (.tflite)"
    assert data["input_shape"] == [1, 224, 224, 3]
    assert data["output_shape"] == [1, 38]

def test_predict_real_image():
    test_image_path = Path("test_images/apple_scab_leaf.jpg")
    assert test_image_path.exists(), "test_images/apple_scab_leaf.jpg should exist"

    with open(test_image_path, "rb") as f:
        response = client.post(
            "/api/predict",
            files={"file": ("apple_scab_leaf.jpg", f, "image/jpeg")},
            data={"ground_truth": "Apple___Apple_scab"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_class"] == "Apple___Apple_scab"
    assert data["confidence"] > 0.90
    assert len(data["top_predictions"]) == 5
    assert data["is_correct"] is True
    assert data["treatment"] is not None
    assert data["treatment"]["crop"] == "Apple"

def test_prediction_history():
    response = client.get("/api/prediction-history")
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 1
    assert history[0]["predicted_class"] == "Apple___Apple_scab"

def test_dataset_info():
    response = client.get("/api/dataset-info")
    assert response.status_code == 200
    data = response.json()
    assert data["num_classes"] == 38
    assert data["total_images"] > 50000

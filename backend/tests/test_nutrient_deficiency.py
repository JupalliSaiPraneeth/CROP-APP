from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

def test_nutrient_model_info():
    response = client.get("/api/nutrient-deficiency/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert "nutrient_deficiency_model.tflite" in data["model_name"]
    assert data["num_classes"] == 36
    assert data["input_shape"] == [1, 224, 224, 3]
    assert data["output_shape"] == [1, 36]
    assert len(data["class_names"]) == 36
    assert data["dataset_name"] == "OLID-I (Open Leaf Image Dataset - Indian Crops)"

def test_nutrient_classes():
    response = client.get("/api/nutrient-deficiency/classes")
    assert response.status_code == 200
    data = response.json()
    assert data["num_classes"] == 36
    assert "by_crop" in data
    assert "by_condition" in data
    assert "tomato" in data["by_crop"]
    assert "cucumber" in data["by_crop"]
    assert "N" in data["by_condition"]
    assert "K" in data["by_condition"]

def test_nutrient_sample_endpoint():
    for sample in ["tomato_nitrogen", "cucumber_potassium", "tomato_healthy"]:
        response = client.get(f"/api/nutrient-deficiency/sample/{sample}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"

    bad_resp = client.get("/api/nutrient-deficiency/sample/non_existent_leaf")
    assert bad_resp.status_code == 404

def test_nutrient_manifest_summary():
    response = client.get("/api/nutrient-deficiency/manifest-summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_samples" in data
    assert data["total_samples"] > 0

def test_nutrient_training_history():
    response = client.get("/api/nutrient-deficiency/training-history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 20

def test_nutrient_inference_real_leaf():
    test_image = Path("test_images/nutrient_tomato_nitrogen.jpg")
    assert test_image.exists()

    with open(test_image, "rb") as f:
        response = client.post(
            "/api/nutrient-deficiency/predict",
            files={"file": ("nutrient_tomato_nitrogen.jpg", f, "image/jpeg")},
            data={"threshold": "0.30"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "predicted_class" in data
    assert data["confidence"] > 0
    assert len(data["top_predictions"]) == 5
    assert "remedy" in data
    assert "chemical_remedies" in data["remedy"]
    assert "organic_remedies" in data["remedy"]

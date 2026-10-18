from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

def test_pest_model_info():
    response = client.get("/api/pest-detection/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert data["model_name"] == "best.pt"
    assert data["num_classes"] == 97
    assert data["task"] == "detect"
    assert "class_names" in data
    assert len(data["class_names"]) == 97

def test_pest_classes():
    response = client.get("/api/pest-detection/classes")
    assert response.status_code == 200
    data = response.json()
    assert data["num_classes"] == 97
    assert "classes" in data
    assert "taxonomy" in data

def test_pest_sample_endpoint():
    response = client.get("/api/pest-detection/sample/caterpillar")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"

    # Non-existent sample returns 404
    bad_resp = client.get("/api/pest-detection/sample/unknown_bug")
    assert bad_resp.status_code == 404

def test_pest_detection_inference_real_insect():
    test_image = Path("test_images/pest_caterpillar.jpg")
    assert test_image.exists()

    with open(test_image, "rb") as f:
        response = client.post(
            "/api/pest-detection/predict",
            files={"file": ("pest_caterpillar.jpg", f, "image/jpeg")},
            data={
                "confidence_threshold": "0.15",
                "iou_threshold": "0.60",
                "imgsz": "1024",
                "augment": "false"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] >= 1, "High-res inference should detect the caterpillar pest"
    assert len(data["detections"]) == data["count"]
    assert data["imgsz"] == 1024
    det = data["detections"][0]
    assert "class_id" in det
    assert "class_name" in det
    assert "confidence" in det
    assert det["confidence"] >= 0.15
    assert "bbox" in det
    assert det["crop_image"] is not None
    assert det["crop_image"].startswith("data:image/jpeg;base64,")

def test_pest_detection_invalid_format():
    response = client.post(
        "/api/pest-detection/predict",
        files={"file": ("test.txt", b"plain text is not an image", "text/plain")},
        data={"confidence_threshold": "0.15"}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_health_includes_pest_model():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert data["pest_model_loaded"] is True
    assert data["pest_classes_count"] == 97

def test_pest_detection_human_guard_filtering():
    human_image = Path("test_images/test_human_face.jpg")
    assert human_image.exists()

    with open(human_image, "rb") as f:
        response = client.post(
            "/api/pest-detection/predict",
            files={"file": ("test_human_face.jpg", f, "image/jpeg")},
            data={"confidence_threshold": "0.15", "imgsz": "1024"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 0, "Human face should yield 0 pest detections"
    assert data["human_detected"] is True
    assert data["filtered_count"] >= 1
    assert data["context_warning"] is not None


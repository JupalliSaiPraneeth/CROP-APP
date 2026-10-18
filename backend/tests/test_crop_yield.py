from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.crop_yield_service import yield_service

client = TestClient(app)


def test_yield_service_initialization():
    assert yield_service.is_loaded is True
    assert len(yield_service.states) >= 30
    assert len(yield_service.districts) >= 600
    assert len(yield_service.crops) >= 100
    assert len(yield_service.seasons) >= 5


def test_yield_categories_endpoint():
    response = client.get("/api/crop-yield/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["states_count"] == 33
    assert data["districts_count"] == 632
    assert data["crops_count"] == 115
    assert "Maharashtra" in data["states"]
    assert "Sugarcane" in data["crops"]
    assert len(data["presets"]) >= 5


def test_yield_presets_endpoint():
    response = client.get("/api/crop-yield/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 5
    assert any(p["crop"] == "Sugarcane" for p in presets)


def test_yield_model_info_endpoint():
    response = client.get("/api/crop-yield/model-info")
    assert response.status_code == 200
    info = response.json()
    assert info["model_loaded"] is True
    assert "Random Forest" in info["algorithm"]
    assert info["metrics"]["R2"] > 0.75
    assert len(info["top_features"]) >= 10


def test_yield_predict_single_sugarcane():
    payload = {
        "state": "Maharashtra",
        "district": "KOLHAPUR",
        "season": "Whole Year",
        "crop": "Sugarcane",
        "crop_year": 2024,
        "area": 25.0
    }
    response = client.post("/api/crop-yield/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Sugarcane"
    assert data["predicted_yield_per_hectare"] > 0.0
    assert data["estimated_total_production_tonnes"] > 0.0
    assert data["estimated_total_production_quintals"] == round(data["estimated_total_production_tonnes"] * 10, 2)
    assert len(data["agronomic_advisory"]) >= 2
    assert len(data["top_factors"]) == 3
    assert data["inference_time_ms"] > 0.0


def test_yield_predict_batch_portfolio():
    payload = {
        "items": [
            {
                "plot_name": "Plot A",
                "state": "Maharashtra",
                "district": "KOLHAPUR",
                "season": "Whole Year",
                "crop": "Sugarcane",
                "crop_year": 2024,
                "area": 20.0
            },
            {
                "plot_name": "Plot B",
                "state": "West Bengal",
                "district": "BURDWAN",
                "season": "Kharif",
                "crop": "Rice",
                "crop_year": 2024,
                "area": 10.0
            }
        ]
    }
    response = client.post("/api/crop-yield/predict-batch", json=payload)
    assert response.status_code == 200
    batch = response.json()
    assert batch["total_plots"] == 2
    assert batch["total_area_hectares"] == 30.0
    assert batch["total_estimated_production_tonnes"] > 0.0
    assert batch["average_yield_per_hectare"] > 0.0
    assert len(batch["results"]) == 2


def test_yield_simulate_scenarios():
    response = client.get(
        "/api/crop-yield/simulate-scenarios",
        params={
            "state": "Maharashtra",
            "district": "KOLHAPUR",
            "area": 20.0,
            "crop_year": 2024
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) >= 3
    assert any(s["crop"] == "Sugarcane" for s in data["scenarios"])


def test_yield_invalid_area_negative():
    payload = {
        "state": "Maharashtra",
        "district": "KOLHAPUR",
        "season": "Whole Year",
        "crop": "Sugarcane",
        "crop_year": 2024,
        "area": -5.0
    }
    response = client.post("/api/crop-yield/predict", json=payload)
    assert response.status_code == 422 or response.status_code == 400

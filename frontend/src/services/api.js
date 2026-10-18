// Centralized API client for Crop Disease AI Backend

const getBaseUrl = () => {
  // 1. Check if user configured a custom URL in localStorage (Settings tab)
  const storedUrl = localStorage.getItem("crop_ai_api_url");
  if (storedUrl && storedUrl.trim()) {
    return storedUrl.trim().replace(/\/+$/, "");
  }

  // 2. Check environment variable injected at build time (e.g. on Vercel)
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 3. Fallback to local FastAPI development server
  return "http://127.0.0.1:8001";
};

export const setBaseUrl = (url) => {
  if (!url || !url.trim()) {
    localStorage.removeItem("crop_ai_api_url");
  } else {
    localStorage.setItem("crop_ai_api_url", url.trim().replace(/\/+$/, ""));
  }
};

export const api = {
  getBaseUrl,

  async checkHealth() {
    try {
      const res = await fetch(`${getBaseUrl()}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { status: "disconnected", model_loaded: false, error: err.message };
    }
  },

  async getModelInfo() {
    const res = await fetch(`${getBaseUrl()}/api/model-info`);
    if (!res.ok) throw new Error("Failed to fetch model info");
    return await res.json();
  },

  async predictSingle(file, groundTruth = null, threshold = 0.60) {
    const formData = new FormData();
    formData.append("file", file);
    if (groundTruth) {
      formData.append("ground_truth", groundTruth);
    }
    formData.append("threshold", threshold);

    const res = await fetch(`${getBaseUrl()}/api/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Inference failed" }));
      throw new Error(err.detail || "Prediction request failed");
    }
    return await res.json();
  },

  async predictBatch(files, threshold = 0.60) {
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    formData.append("threshold", threshold);

    const res = await fetch(`${getBaseUrl()}/api/predict-batch`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Batch inference failed" }));
      throw new Error(err.detail || "Batch prediction request failed");
    }
    return await res.json();
  },

  async runEvaluation(payload = { samples_per_class: 5, max_total_samples: 190, source_folder: "PlantVillage" }) {
    const res = await fetch(`${getBaseUrl()}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Evaluation failed" }));
      throw new Error(err.detail || "Model evaluation failed");
    }
    return await res.json();
  },

  async getEvaluationResults() {
    const res = await fetch(`${getBaseUrl()}/api/evaluation-results`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch evaluation results");
    }
    return await res.json();
  },

  async getDatasetInfo() {
    const res = await fetch(`${getBaseUrl()}/api/dataset-info`);
    if (!res.ok) throw new Error("Failed to load dataset info");
    return await res.json();
  },

  async getPredictionHistory() {
    const res = await fetch(`${getBaseUrl()}/api/prediction-history`);
    if (!res.ok) throw new Error("Failed to fetch prediction history");
    return await res.json();
  },

  async clearHistory() {
    const res = await fetch(`${getBaseUrl()}/api/prediction-history`, {
      method: "DELETE",
    });
    return await res.json();
  },

  getExportCsvUrl() {
    return `${getBaseUrl()}/api/export/csv`;
  },

  getExportClassificationReportUrl() {
    return `${getBaseUrl()}/api/export/classification-report`;
  },

  getExportPdfUrl() {
    return `${getBaseUrl()}/api/export/pdf`;
  },

  getSampleImageUrl(className, imageName) {
    return `${getBaseUrl()}/api/dataset-image/${encodeURIComponent(className)}/${encodeURIComponent(imageName)}`;
  },

  // Pest Detection API (YOLO11 best.pt)
  async predictPest(file, confidenceThreshold = 0.15, iouThreshold = 0.60, imgsz = 1024, augment = false) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("confidence_threshold", confidenceThreshold);
    formData.append("iou_threshold", iouThreshold);
    formData.append("imgsz", imgsz);
    formData.append("augment", augment);

    const res = await fetch(`${getBaseUrl()}/api/pest-detection/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Pest detection failed" }));
      throw new Error(err.detail || "Pest detection inference request failed");
    }
    return await res.json();
  },

  getPestSampleImageUrl(sampleName) {
    return `${getBaseUrl()}/api/pest-detection/sample/${encodeURIComponent(sampleName)}`;
  },

  async getPestModelInfo() {
    const res = await fetch(`${getBaseUrl()}/api/pest-detection/model-info`);
    if (!res.ok) throw new Error("Failed to fetch pest detection model info");
    return await res.json();
  },

  async getPestClasses() {
    const res = await fetch(`${getBaseUrl()}/api/pest-detection/classes`);
    if (!res.ok) throw new Error("Failed to fetch pest classes");
    return await res.json();
  },

  // Nutrient Deficiency API (MobileNetV3 OLID-I Model)
  async predictNutrient(file, groundTruth = null, threshold = 0.50, cropHint = null) {
    const formData = new FormData();
    formData.append("file", file);
    if (groundTruth) {
      formData.append("ground_truth", groundTruth);
    }
    formData.append("threshold", threshold);
    if (cropHint && cropHint !== "All") {
      formData.append("crop_hint", cropHint);
    }

    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Inference failed" }));
      throw new Error(err.detail || "Nutrient deficiency prediction request failed");
    }
    return await res.json();
  },

  async predictNutrientBatch(files, threshold = 0.50, cropHint = null) {
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    formData.append("threshold", threshold);
    if (cropHint && cropHint !== "All") {
      formData.append("crop_hint", cropHint);
    }

    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/predict-batch`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Batch inference failed" }));
      throw new Error(err.detail || "Nutrient batch prediction request failed");
    }
    return await res.json();
  },

  async getNutrientModelInfo() {
    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/model-info`);
    if (!res.ok) throw new Error("Failed to fetch nutrient model info");
    return await res.json();
  },

  async getNutrientClasses() {
    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/classes`);
    if (!res.ok) throw new Error("Failed to fetch nutrient classes");
    return await res.json();
  },

  async getNutrientManifestSummary() {
    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/manifest-summary`);
    if (!res.ok) throw new Error("Failed to fetch nutrient manifest summary");
    return await res.json();
  },

  async getNutrientTrainingHistory() {
    const res = await fetch(`${getBaseUrl()}/api/nutrient-deficiency/training-history`);
    if (!res.ok) throw new Error("Failed to fetch nutrient training history");
    return await res.json();
  },

  getNutrientSampleImageUrl(sampleName) {
    return `${getBaseUrl()}/api/nutrient-deficiency/sample/${encodeURIComponent(sampleName)}`;
  },

  // Crop Yield Prediction API
  async predictYield(payload) {
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Yield prediction failed" }));
      throw new Error(err.detail || "Crop yield prediction request failed");
    }
    return await res.json();
  },

  async predictYieldBatch(items) {
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/predict-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Batch yield prediction failed" }));
      throw new Error(err.detail || "Batch yield prediction request failed");
    }
    return await res.json();
  },

  async getYieldCategories() {
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/categories`);
    if (!res.ok) throw new Error("Failed to fetch crop yield categories");
    return await res.json();
  },

  async getYieldPresets() {
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/presets`);
    if (!res.ok) throw new Error("Failed to fetch crop yield presets");
    return await res.json();
  },

  async getYieldModelInfo() {
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/model-info`);
    if (!res.ok) throw new Error("Failed to fetch crop yield model info");
    return await res.json();
  },

  async simulateYieldScenarios(state, district, area, cropYear = 2024) {
    const params = new URLSearchParams({
      state,
      district,
      area: area.toString(),
      crop_year: cropYear.toString(),
    });
    const res = await fetch(`${getBaseUrl()}/api/crop-yield/simulate-scenarios?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to simulate yield scenarios");
    return await res.json();
  },

  // Market Price Prediction API (Advanced Feature)
  async getMarketPriceCommodities() {
    const res = await fetch(`${getBaseUrl()}/api/market-price/commodities`);
    if (!res.ok) throw new Error("Failed to fetch market price commodities");
    return await res.json();
  },

  async predictMarketPrice(payload) {
    const res = await fetch(`${getBaseUrl()}/api/market-price/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Price prediction failed" }));
      throw new Error(err.detail || "Market price forecast request failed");
    }
    return await res.json();
  },

  async getMarketPriceHistorical(commodity, state = null) {
    const params = new URLSearchParams({ commodity });
    if (state) params.append("state", state);
    const res = await fetch(`${getBaseUrl()}/api/market-price/historical?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch historical price trends");
    return await res.json();
  },

  async getMarketPriceModelInfo() {
    const res = await fetch(`${getBaseUrl()}/api/market-price/model-info`);
    if (!res.ok) throw new Error("Failed to fetch market price model info");
    return await res.json();
  }
};


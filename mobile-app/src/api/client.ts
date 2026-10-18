// Centralized API Client for CropAI Mobile Application
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthResponse,
  PredictionResponse,
  PestDetectionResponse,
  NutrientPredictionResponse,
  CropYieldPredictRequest,
  CropYieldPredictionResponse,
  CropYieldCategoriesResponse,
} from '../types/api';

const DEFAULT_API_URL = 'https://crop-app-419s.onrender.com';
const STORAGE_KEY = 'crop_ai_mobile_api_url';

let cachedBaseUrl: string | null = null;

export const getBaseUrl = async (): Promise<string> => {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) {
      cachedBaseUrl = stored.trim().replace(/\/+$/, '');
      return cachedBaseUrl;
    }
  } catch {
    // Ignore storage errors and fall back to default
  }
  cachedBaseUrl = DEFAULT_API_URL;
  return cachedBaseUrl;
};

export const setBaseUrl = async (url: string): Promise<void> => {
  const clean = url.trim().replace(/\/+$/, '');
  cachedBaseUrl = clean;
  await AsyncStorage.setItem(STORAGE_KEY, clean);
};

export const resetBaseUrl = async (): Promise<void> => {
  cachedBaseUrl = DEFAULT_API_URL;
  await AsyncStorage.removeItem(STORAGE_KEY);
};

// Helper: fetch with custom timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. The cloud server may be waking up, please retry in a few seconds.');
    }
    throw error;
  }
};

// Helper: format local image URI into React Native FormData
const appendImageToFormData = (formData: FormData, fieldName: string, imageUri: string) => {
  const uriParts = imageUri.split('/');
  const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  let mimeType = 'image/jpeg';
  if (fileExt === 'png') mimeType = 'image/png';
  if (fileExt === 'webp') mimeType = 'image/webp';

  // React Native file attachment format
  formData.append(fieldName, {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as any);
};

export const api = {
  getBaseUrl,
  setBaseUrl,
  resetBaseUrl,

  // 1. System Health
  async checkHealth(): Promise<HealthResponse> {
    try {
      const base = await getBaseUrl();
      const res = await fetchWithTimeout(`${base}/api/health`, { method: 'GET' }, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        status: 'disconnected',
        model_loaded: false,
        error: err.message || 'Cannot reach server',
      };
    }
  },

  // 2. Crop Disease Detection (MobileNetV2 38 Classes)
  async predictDisease(imageUri: string, threshold = 0.60): Promise<PredictionResponse> {
    const base = await getBaseUrl();
    const formData = new FormData();
    appendImageToFormData(formData, 'file', imageUri);
    formData.append('threshold', threshold.toString());

    const res = await fetchWithTimeout(`${base}/api/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    }, 30000);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(errorJson.detail || 'Disease diagnosis request failed');
    }
    return await res.json();
  },

  // 3. Pest Detection (YOLO11 IP102 Model)
  async predictPest(imageUri: string, confidenceThreshold = 0.15): Promise<PestDetectionResponse> {
    const base = await getBaseUrl();
    const formData = new FormData();
    appendImageToFormData(formData, 'file', imageUri);
    formData.append('confidence_threshold', confidenceThreshold.toString());
    formData.append('iou_threshold', '0.60');
    formData.append('imgsz', '1024');

    const res = await fetchWithTimeout(`${base}/api/pest-detection/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    }, 35000);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: 'Pest detection failed' }));
      throw new Error(errorJson.detail || 'Pest detection request failed');
    }
    return await res.json();
  },

  // 4. Nutrient Deficiency Diagnosis (MobileNetV3 OLID-I)
  async predictNutrient(imageUri: string, cropHint?: string): Promise<NutrientPredictionResponse> {
    const base = await getBaseUrl();
    const formData = new FormData();
    appendImageToFormData(formData, 'file', imageUri);
    formData.append('threshold', '0.50');
    if (cropHint && cropHint !== 'All') {
      formData.append('crop_hint', cropHint);
    }

    const res = await fetchWithTimeout(`${base}/api/nutrient-deficiency/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    }, 30000);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: 'Nutrient analysis failed' }));
      throw new Error(errorJson.detail || 'Nutrient diagnosis request failed');
    }
    return await res.json();
  },

  // 5. Crop Yield Prediction (Tabular ML)
  async getYieldCategories(): Promise<CropYieldCategoriesResponse> {
    const base = await getBaseUrl();
    const res = await fetchWithTimeout(`${base}/api/crop-yield/categories`, { method: 'GET' }, 10000);
    if (!res.ok) throw new Error('Failed to load yield categories');
    return await res.json();
  },

  async predictYield(payload: CropYieldPredictRequest): Promise<CropYieldPredictionResponse> {
    const base = await getBaseUrl();
    const res = await fetchWithTimeout(`${base}/api/crop-yield/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 15000);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: 'Yield calculation failed' }));
      throw new Error(errorJson.detail || 'Crop yield prediction failed');
    }
    return await res.json();
  },

  // 6. Market Price Prediction
  async getMarketCommodities(): Promise<any[]> {
    const base = await getBaseUrl();
    const res = await fetchWithTimeout(`${base}/api/market-price/commodities`, { method: 'GET' }, 10000);
    if (!res.ok) throw new Error('Failed to load market commodities');
    return await res.json();
  },

  async predictMarketPrice(payload: { commodity: string; state?: string }): Promise<any> {
    const base = await getBaseUrl();
    const res = await fetchWithTimeout(`${base}/api/market-price/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 15000);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ detail: 'Price forecast failed' }));
      throw new Error(errorJson.detail || 'Market price prediction failed');
    }
    return await res.json();
  },
};

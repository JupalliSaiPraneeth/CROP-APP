# CropAI Ecosystem — Native Mobile Application (React Native + Expo)

A cross-platform native mobile application built with **React Native**, **Expo (SDK 52)**, and **TypeScript** for Android & iOS. Communicates directly with the production FastAPI deep learning backend hosted on Render.

---

## 📱 Features & Web-to-Mobile Feature Mapping

| Web Application Module | Mobile Screen | Native Implementation & Models |
| :--- | :--- | :--- |
| **System Overview** | `HomeScreen.tsx` | Dashboard with live cloud connectivity status, quick diagnostic triggers, and model statistics. |
| **Disease Detection** | `DiseaseDetectionScreen.tsx` | Native camera & gallery leaf photography (`expo-image-picker`), MobileNetV2 38-class PlantVillage model, top-3 hypotheses, symptoms, chemical spray dosages & organic IPM controls. |
| **Pest Detection** | `PestDetectionScreen.tsx` | High-resolution pest photography, YOLO11 97-species computer vision, detection counts, confidence pills, and biological/chemical controls. |
| **Nutrient Deficiency** | `NutrientScreen.tsx` | MobileNetV3 OLID-I foliar scanner, crop context chips (Tomato, Potato, Rice, Wheat, Cotton), severity tags, and N-P-K / micronutrient fertilizer calculators. |
| **Crop Yield Prediction** | `YieldPredictionScreen.tsx` | Tabular ML regression for Indian agricultural states & 632 districts, multi-crop inputs, tonnes per hectare & total production forecasts. |
| **Market Price Forecast** | `MarketPriceScreen.tsx` | 13 agricultural commodities, live mandi modal prices, 30-day price trend projections, and harvest release advisory. |
| **Settings & Diagnostics** | `SettingsScreen.tsx` | Dynamic API URL override (stored via `AsyncStorage`), real-time model health pings, and cache controls. |

---

## 🛠️ Technology Stack

- **Framework**: React Native 0.88 + Expo SDK 58
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Device Capabilities**:
  - `expo-image-picker`: Live field camera and photo gallery access
  - `expo-haptics`: Tactile feedback for diagnosis scans and button interactions
  - `@react-native-async-storage/async-storage`: Offline caching and settings persistence
  - `@expo/vector-icons`: Native Ionicons iconography
- **Production API Endpoint**: `https://crop-app-419s.onrender.com`

---

## 🚀 Running the App Locally

### 1. Prerequisites
- Node.js 18+ installed on your computer.
- Download the **Expo Go** app from the Google Play Store (Android) or Apple App Store (iOS) on your physical smartphone.

### 2. Start the Development Server
In your terminal, navigate to `mobile-app`:
```bash
cd mobile-app
npx expo start
```

### 3. Open on Your Phone
- **Android**: Open the **Expo Go** app on your phone and scan the QR code displayed in your terminal.
- **iOS**: Open the native **Camera** app and tap the prompt to open in **Expo Go**.
- The app will load instantly on your phone with live reload and full hardware camera support!

---

## 📦 Building an Installable Android APK

We have pre-configured `eas.json` with a dedicated `preview` profile that compiles a direct standalone `.apk` file for sideloading on Android devices:

### 1. Install EAS CLI (Globally)
```bash
npm install -g eas-cli
```

### 2. Login to your free Expo account
```bash
eas login
```

### 3. Build the Standalone APK
```bash
cd mobile-app
eas build --platform android --profile preview
```
- EAS cloud will build your native Android APK.
- Once finished, you will receive a direct download link for your `CropAI.apk` ready to install on any Android phone!

### 4. Build for Google Play Store (AAB)
When ready for official store submission:
```bash
eas build --platform android --profile production
```

---

## ⚙️ Environment Variables

The application is pre-configured with the live production endpoint. To customize:
1. Open `.env` (or copy `.env.example`):
   ```env
   EXPO_PUBLIC_API_URL=https://crop-app-419s.onrender.com
   ```
2. You can also change the API endpoint directly from inside the app by going to the **Settings** tab.

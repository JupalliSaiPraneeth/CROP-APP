# CropAI Ecosystem — Mobile App Deployment Guide
## Deploying CropAI as an Android & iOS Mobile Application

CropAI is engineered as an offline-capable, responsive Single Page Application (SPA). Because it uses modern web standards, lightweight SVG graphics, and responsive touch layouts, it can be deployed to mobile devices through **three distinct approaches**:

---

## Comparison of Mobile Deployment Methods

| Feature | Method 1: PWA (Installable Web App) | Method 2: Capacitor (Native Android APK / Play Store) | Method 3: PWABuilder / TWA |
|---------|--------------------------------------|-------------------------------------------------------|----------------------------|
| **Cost** | **100% Free** | Free (Dev fee only if publishing to Play Store) | Free |
| **Setup Time** | **Instant (0 minutes)** | 5–10 minutes | 2 minutes |
| **Requires Android Studio?** | No | Yes (or CLI) | No |
| **Distribution** | Direct browser install ("Add to Home Screen") | APK sideloading or Google Play Store | Google Play Store |
| **Offline UI & Standalone** | Yes (no browser address bar) | Yes (100% native container) | Yes |
| **Camera Access** | Yes (Web Media Capture / File Picker) | Yes (Native Hardware Camera Plugin) | Yes |

---

## Method 1: Progressive Web App (PWA — Instant 0-Minute Deploy)

The repository is **already pre-configured** with a Web App Manifest ([frontend/public/manifest.json](file:///c:/plant/frontend/public/manifest.json)) and high-resolution vector icon ([frontend/public/icon.svg](file:///c:/plant/frontend/public/icon.svg)).

### On Android (Google Chrome):
1. Open your live Vercel URL (e.g. `https://cropai-ecosystem.vercel.app`) on your mobile browser.
2. Tap the browser menu (three dots in top-right corner) and select **"Install app"** or **"Add to Home screen"**.
3. Confirm the prompt.
4. An icon titled **CropAI** will appear on your home screen and app drawer.
5. Opening the app runs it in **full-screen standalone mode** with zero browser URL bar or navigation buttons.

### On iOS (Apple Safari):
1. Open your live Vercel URL in Safari.
2. Tap the **Share** button (box with upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right.

---

## Method 2: Native Android APK with Capacitor (Google Play Store Ready)

To generate a real `.apk` (for direct sideloading on Android phones) or `.aab` (for Google Play Console submission), use Capacitor:

### 1. Install Capacitor dependencies
In your terminal:
```bash
cd c:\plant\frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Initialize and sync the Android project
```bash
# Add Android native platform
npx cap add android

# Build the latest production web assets
npm run build

# Copy web assets into the Android native project
npx cap sync
```

### 3. Open in Android Studio & Generate APK
```bash
npx cap open android
```
Once Android Studio opens:
1. Wait for Gradle build to index.
2. In the top menu, click:  
   **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Once completed, click **"locate"** to find your compiled `app-debug.apk` file.
4. Transfer this `.apk` to any Android phone via WhatsApp, USB, or Google Drive and tap to install!

---

## Method 3: PWABuilder (Fastest Play Store Package)

If you have deployed your app to Vercel and want to publish it on the Google Play Store without writing any native Java/Kotlin code:

1. Open [pwabuilder.com](https://www.pwabuilder.com).
2. Enter your live Vercel URL (e.g. `https://cropai-ecosystem.vercel.app`).
3. PWABuilder will automatically read your `manifest.json`, validate the icons, and test standalone display.
4. Click **"Package for Stores"** → **Android**.
5. Download the generated `.apk` and signed `.aab` package ready for immediate upload to the **Google Play Console**.

---

## Mobile Camera & In-Field Leaf Diagnosis

On mobile devices, when a farmer taps **"Upload Leaf Photograph"** or **"Upload Pest Image"**:
- The mobile operating system automatically provides the native system prompt:
  - 📷 **Take Photo (Live Camera)** — snaps a high-res photo directly of a diseased plant or insect.
  - 📁 **Choose from Photo Gallery** — selects a saved picture.
- Mobile images are instantly analyzed by the cloud FastAPI backend, displaying diagnosis badges, IPM controls, and dosages directly on their smartphone.

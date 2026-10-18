# CropAI Ecosystem — Cloud Deployment Guide
## Vercel (Frontend) + Containerized Cloud (FastAPI Backend)

This guide provides end-to-end instructions for deploying the **CropAI Ecosystem** into production using the industry-standard decoupled architecture:
- **Frontend**: Deployed on **Vercel** (Global Edge CDN, sub-second load times, automatic SSL, zero maintenance).
- **Backend**: Deployed as a container on **Render**, **Hugging Face Spaces** (100% Free 16GB RAM tier), **Railway**, or **AWS/DigitalOcean** (unconstrained ML inference with PyTorch, YOLO11, TensorFlow Lite, Scikit-Learn, and Agmarknet econometric engines).

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  React 18 + Vite SPA (dist/)                                 │
│  Domain: https://crop-ai-ecosystem.vercel.app                │
└──────────────────────────────┬───────────────────────────────┘
                               │
            REST API Calls (HTTPS / JSON / Multipart)
            CORS Origin: https://*.vercel.app
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│       Cloud ML Backend (Render / HF Spaces / Railway)        │
│  FastAPI + Uvicorn (Port 8001 / $PORT)                       │
│                                                              │
│  ├── Engine 1: PlantVillage MobileNetV3 (Disease AI)         │
│  ├── Engine 2: YOLO11 Object Detection (Pest AI)            │
│  ├── Engine 3: OLID-I MobileNetV3 (Nutrient AI)              │
│  ├── Engine 4: Random Forest Pipeline (Crop Yield AI)        │
│  └── Engine 5: Agmarknet Time-Series (Market Price AI)       │
└──────────────────────────────────────────────────────────────┘
```

> **Why Decoupled?**  
> Vercel Serverless Functions have a strict **250 MB uncompressed package limit** and a 10–60 second execution timeout. Deep learning frameworks (PyTorch for YOLO11, TensorFlow, and Scikit-Learn) require ~1.2 GB of runtime binaries. Running the ML engine in a lightweight container while serving the frontend via Vercel provides maximum speed, high reliability, and zero cost.

---

## 2. Step 1: Deploy the Backend (Choose Any Option)

### Option A: Deploy on Render (Recommended, 1-Click Docker)
1. Push your project code to **GitHub** (or GitLab).
2. Go to [render.com](https://render.com) and click **"New +" → "Web Service"**.
3. Select your repository.
4. Fill in the deployment settings:
   - **Name**: `cropai-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Starter` (or Free)
5. Under **Environment Variables**, add:
   - `PORT`: `10000`
   - `CORS_ORIGINS`: `*`
   - `CORS_ORIGIN_REGEX`: `https://.*\.vercel\.app`
6. Click **"Deploy Web Service"**.
7. Once the build finishes, copy your live backend URL (e.g. `https://cropai-backend.onrender.com`).
8. Test the deployment by opening `https://cropai-backend.onrender.com/api/health` in your browser. You will see:
   ```json
   {
     "status": "healthy",
     "models": {
       "crop_disease": "loaded",
       "pest_detection": "loaded",
       "nutrient_deficiency": "loaded",
       "crop_yield": "loaded",
       "market_price": "loaded"
     }
   }
   ```

---

### Option B: Deploy on Hugging Face Spaces (100% Free 16 GB RAM CPU)
Hugging Face Spaces offers **free 16 GB RAM and 2 vCPUs**, making it ideal for deep learning models.

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. Settings:
   - **Space name**: `cropai-backend`
   - **License**: `mit`
   - **SDK**: `Docker` → **Blank**
   - **Space Hardware**: `CPU basic • 2 vCPU • 16GB RAM` (Free)
3. Push your repository to the Hugging Face Git remote:
   ```bash
   git remote add space https://huggingface.co/spaces/<your-username>/cropai-backend
   git push space main
   ```
4. In Space Settings, set the environment variables:
   - `PORT`: `7860`
   - `CORS_ORIGINS`: `*`
5. Your public backend endpoint will be:  
   `https://<your-username>-cropai-backend.hf.space`

---

### Option C: Deploy on Railway
1. Go to [railway.app](https://railway.app) and click **"New Project" → "Deploy from GitHub repo"**.
2. Railway detects `railway.json` and `Dockerfile` automatically.
3. In **Variables**, add:
   - `PORT`: `8001`
   - `CORS_ORIGINS`: `*`
4. Under **Settings → Networking**, click **"Generate Domain"** to get your public HTTPS URL.

---

### Option D: Deploy on a Cloud VPS (AWS EC2 / DigitalOcean / Linode)
If you prefer running on your own VM or VPS:
```bash
git clone <your-repo-url>
cd plant
docker compose up -d --build
```
Your backend will run on `http://<your-server-ip>:8001` and frontend on `http://<your-server-ip>:3000`.

---

## 3. Step 2: Deploy the Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **"Add New..." → "Project"**.
2. Select your GitHub repository.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend` (or leave as `./` since root `vercel.json` is configured).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Expand **"Environment Variables"** and add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `VITE_API_URL` | `https://cropai-backend.onrender.com` | Your live backend URL from Step 1 |
5. Click **"Deploy"**.
6. In ~45 seconds, Vercel will assign you an instant production URL:  
   `https://crop-ai-ecosystem.vercel.app`

---

## 4. Step 3: Zero-Rebuild In-App Dynamic Switching

CropAI includes a **dynamic runtime endpoint configuration system**:

1. Open your deployed Vercel site.
2. Navigate to **Platform Settings** (`/settings`).
3. You can update or switch your **Backend API Base URL** on the fly without triggering a rebuild or redeployment.
4. Click **"Save URL"** — it instantly updates local storage, refreshes the health telemetry pill in the top navbar, and establishes live model connectivity.
5. If the site is opened on Vercel before the backend is linked, a helpful non-intrusive banner automatically appears:
   > *Cloud Deployment Notice: Frontend is live on your-domain.vercel.app, but backend endpoint is currently set to localhost. Click here to connect your live backend.*

---

## 5. Pre-Configured Deployment Files Reference

The repository already includes all necessary deployment manifests:

| File | Purpose |
|------|---------|
| [frontend/vercel.json](file:///c:/plant/frontend/vercel.json) | Vercel SPA routing rewrite rules and immutable asset cache headers |
| [vercel.json](file:///c:/plant/vercel.json) | Root Vercel fallback configuration |
| [Dockerfile](file:///c:/plant/Dockerfile) | Production Dockerfile with CPU-optimized PyTorch and system libraries |
| [docker-compose.yml](file:///c:/plant/docker-compose.yml) | Multi-container local or VPS composition |
| [render.yaml](file:///c:/plant/render.yaml) | 1-Click Render Blueprint configuration |
| [railway.json](file:///c:/plant/railway.json) | Railway cloud deployment schema |
| [frontend/.env.example](file:///c:/plant/frontend/.env.example) | Frontend environment variable template |
| [backend/app/main.py](file:///c:/plant/backend/app/main.py) | Dynamic CORS configuration with `*.vercel.app` regex matching |

---

## 6. Environment Variables Reference

### Frontend (`frontend/.env` or Vercel Dashboard)
- `VITE_API_URL`: Base URL of the backend (e.g. `https://cropai-backend.onrender.com`).

### Backend (Docker / Render / Railway)
- `PORT`: Port to listen on (default `8001` or provided by cloud host like `10000`).
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g. `*` or `https://mycustomdomain.com`).
- `CORS_ORIGIN_REGEX`: Regex pattern for matching dynamic origins (default: `https://.*\.vercel\.app|https://.*\.onrender\.com`).
- `MODELS_DIR`: Path to trained model folder (default: `/app/models`).
- `PEST_GUARD_ENABLED`: `true` to enable insect/non-crop domain gating.

---

## 7. Verifying Deployed Endpoints

After deployment, test the health check:
```bash
curl https://cropai-backend.onrender.com/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "pest_model_loaded": true,
  "nutrient_model_loaded": true,
  "yield_model_loaded": true,
  "market_price_loaded": true,
  "models": {
    "crop_disease": "loaded",
    "pest_detection": "loaded",
    "nutrient_deficiency": "loaded",
    "crop_yield": "loaded",
    "market_price": "loaded"
  }
}
```

Once connected, all 5 AI modules will display green **"Ready"** telemetry status badges on your Vercel web application dashboard.

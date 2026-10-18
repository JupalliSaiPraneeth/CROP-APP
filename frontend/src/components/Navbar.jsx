import React from 'react';
import { Menu, Wifi, WifiOff, HardDrive, RefreshCw } from 'lucide-react';

export const TAB_TITLES = {
  overview: { title: 'Platform Overview', subtitle: 'Real-time telemetry, model status, and benchmark indicators' },
  detection: { title: 'Crop Disease Detection', subtitle: 'Upload a leaf photograph to run on-device TFLite inference' },
  pest_detection: { title: 'Pest & Insect Detection', subtitle: 'Real-time YOLO11 vision detection across 97 agricultural insect classes' },
  nutrient_deficiency: { title: 'Nutrient Deficiency Diagnosis', subtitle: 'MobileNetV3 diagnosis for Nitrogen, Phosphorus, Potassium, Iron & Zinc' },
  yield_prediction: { title: 'Crop Yield Forecasting', subtitle: 'Random Forest yield and harvest production forecasting across 632 districts' },
  market_price: { title: 'Crop Market Price Prediction', subtitle: 'Agmarknet historical wholesale price forecasting, MSP comparisons, and market timing' },
  testing: { title: 'Model Testing Studio', subtitle: 'Single image, multi-image batch, and dataset validation' },
  reports: { title: 'Evaluation Reports', subtitle: 'Confusion matrix, precision, recall, F1, and PDF export' },
  dataset: { title: 'PlantVillage Dataset Explorer', subtitle: 'Browse 38 supported disease categories, images, and crops' },
  model_info: { title: 'Model Architecture & Specs', subtitle: 'AI model parameters, tensor dimensions, and operational characteristics' },
  settings: { title: 'Platform Settings', subtitle: 'Backend endpoints, confidence threshold, and preferences' },
};

export default function Navbar({ activeTab, health, onRefreshHealth, isMobileOpen, setIsMobileOpen }) {
  const current = TAB_TITLES[activeTab] || { title: 'Crop Disease AI', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-bold text-slate-900 text-base leading-tight">{current.title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health status badge */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
          ${health?.status === 'healthy' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'}
        `}>
          {health?.status === 'healthy' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Backend Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span>Disconnected</span>
            </>
          )}
        </div>

        <button
          onClick={onRefreshHealth}
          title="Refresh connection status"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

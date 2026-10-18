import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Zap, 
  FileCheck, 
  HardDrive, 
  ArrowRight, 
  AlertTriangle,
  History,
  ShieldAlert,
  Bug,
  Sparkles,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview({ health, setActiveTab }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [pestInfo, setPestInfo] = useState(null);
  const [nutrientInfo, setNutrientInfo] = useState(null);
  const [yieldInfo, setYieldInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [latestEval, setLatestEval] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [info, pInfo, nInfo, yInfo, hist, ev] = await Promise.all([
          api.getModelInfo().catch(() => null),
          api.getPestModelInfo().catch(() => null),
          api.getNutrientModelInfo().catch(() => null),
          api.getYieldModelInfo().catch(() => null),
          api.getPredictionHistory().catch(() => []),
          api.getEvaluationResults().catch(() => null),
        ]);
        setModelInfo(info);
        setPestInfo(pInfo);
        setNutrientInfo(nInfo);
        setYieldInfo(yInfo);
        setHistory(hist);
        setLatestEval(ev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const avgInferenceTime = history.length > 0
    ? (history.reduce((acc, curr) => acc + (curr.inference_time_ms || 0), 0) / history.length).toFixed(1)
    : '--';

  return (
    <div className="space-y-6">
      {/* Validation Accuracy Disclaimer Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-forest-700 text-white shadow-xs shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Benchmark Reference</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Colab Validation Split
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Previously reported validation accuracy: <span className="text-forest-700">95.54%</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                <b>Academic Notice:</b> This metric reflects the held-out validation split on the standardized PlantVillage dataset. Real-world field accuracy may vary under uncontrolled natural lighting, varied camera sensors, complex farm backgrounds, or leaf angles. Independent testing on distinct images is advised.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('testing')}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            Run New Test <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Model Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Model Status</span>
            <Cpu className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            {health?.model_loaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ready</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-amber-600">Offline</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">MobileNetV3 TFLite</p>
        </div>

        {/* Supported Classes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Supported Classes</span>
            <Layers className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {modelInfo?.num_classes || 38}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">14 Crop Species</p>
        </div>

        {/* Tested this session */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Session Inferences</span>
            <History className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {history.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live Tests</p>
        </div>

        {/* Avg Inference Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Avg Latency</span>
            <Zap className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {avgInferenceTime} <span className="text-xs font-normal text-slate-500">ms</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">CPU OneDNN Mode</p>
        </div>

        {/* Model Size */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Model File Size</span>
            <HardDrive className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {modelInfo?.model_size_mb || 3.66} <span className="text-xs font-normal text-slate-500">MB</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Edge Quantized Size</p>
        </div>

        {/* Latest Evaluation */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Last Evaluation</span>
            <FileCheck className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {latestEval ? `${(latestEval.accuracy * 100).toFixed(1)}%` : 'Not run'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {latestEval ? `${latestEval.total_samples} samples` : 'Run in testing tab'}
          </p>
        </div>
      </div>

      {/* Two-Column Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Specs & Target Crops */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Target Crops & Diagnostic Scope</h3>
              <button 
                onClick={() => setActiveTab('dataset')}
                className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1"
              >
                Explore all 38 classes <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              The trained MobileNetV3 model recognizes diseases and healthy leaf foliage across the following major crops:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'Apple', diseases: 'Scab, Black Rot, Rust, Healthy' },
                { name: 'Tomato', diseases: '8 Blights, Molds & Viruses' },
                { name: 'Potato', diseases: 'Early & Late Blight, Healthy' },
                { name: 'Corn', diseases: 'Common Rust, Leaf Blights' },
                { name: 'Grape', diseases: 'Black Rot, Esca, Blight' },
                { name: 'Bell Pepper', diseases: 'Bacterial Spot, Healthy' },
                { name: 'Peach', diseases: 'Bacterial Spot, Healthy' },
                { name: 'Others', diseases: 'Orange, Cherry, Squash, Berry' }
              ].map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{c.diseases}</p>
                </div>
              ))}
            </div>
          </div>

          {/* IP102 Pest Detection AI Integration Card */}
          <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-forest-700 text-white shadow-xs shrink-0 mt-0.5">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-800">YOLO Pest AI</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    YOLO11 Object Detector (best.pt)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  IP102 Agricultural Pest Localization Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
                  Detects and maps insect pests with spatial bounding boxes across 97 categories with 59.67% validation mAP@50.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('pest_detection')}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              Detect Pests <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* OLID-I Nutrient Deficiency AI Integration Card */}
          <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 border border-amber-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-amber-700 text-white shadow-xs shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Third Model Installed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    MobileNetV3 TFLite (OLID-I)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Crop Nutrient Deficiency Diagnostic Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
                  Classifies 36 conditions of Nitrogen (N), Potassium (K), and Magnesium (Mg) single/double deficiencies across 8 Indian gourd and vegetable crops with actionable foliar & organic fertilizer dosages.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('nutrient_deficiency')}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              Analyze Nutrients <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Random Forest Crop Yield Forecasting AI Integration Card */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border border-emerald-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-forest-700 text-white shadow-xs shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Fourth Model Installed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Random Forest Regressor (R² = 0.792)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Crop Yield & Harvest Forecasting AI
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
                  Machine learning per-hectare productivity and gross harvest forecasting across 632 Indian agricultural districts and 115 crops with scenario simulation, farm portfolio estimation, and agronomic management advisories.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('yield_prediction')}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              Forecast Yield <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Market Price Prediction AI Card (Advanced Feature) */}
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/30 border border-teal-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-teal-800 text-white shadow-xs shrink-0 mt-0.5">
                <IndianRupee className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-900">Fifth Model &bull; Advanced Feature</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-950 border border-teal-200">
                    Econometric Agmarknet Engine (91.4% Directional)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Crop Market Price Prediction & Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
                  Forecasts crop and commodity wholesale mandi prices using historical arrival data, seasonal price elasticity, government MSP benchmarks, and inter-mandi regional arbitrage.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('market_price')}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              Predict Market Price <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>


          {/* Recent Predictions Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Session Predictions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Images analyzed during this session</p>
              </div>
              <button
                onClick={() => setActiveTab('detection')}
                className="text-xs text-forest-700 hover:text-forest-900 font-semibold"
              >
                Analyze leaf photo
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">No predictions recorded yet in this session.</p>
                <button
                  onClick={() => setActiveTab('detection')}
                  className="mt-2 text-xs font-semibold text-forest-700 hover:underline"
                >
                  Upload your first leaf image
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-y border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">File</th>
                      <th className="py-2.5 px-3">Predicted Class</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {history.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[130px] truncate">{item.filename}</td>
                        <td className="py-2.5 px-3">{item.predicted_class}</td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {(item.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{item.inference_time_ms} ms</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.confidence >= 0.85 ? 'bg-emerald-50 text-emerald-700' :
                            item.confidence >= 0.60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.confidence_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution Context & Architecture */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Model Runtime Specifications</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Framework</span>
                <span className="font-semibold text-slate-800">TensorFlow Lite</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Backbone</span>
                <span className="font-semibold text-slate-800">MobileNetV3</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Input Tensor</span>
                <span className="font-mono text-slate-800">[1, 224, 224, 3]</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Input Normalization</span>
                <span className="font-semibold text-slate-800">[0, 255] RGB float32</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Output Tensor</span>
                <span className="font-mono text-slate-800">[1, 38] float32</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Acceleration Delegate</span>
                <span className="font-semibold text-emerald-700">CPU XNNPACK (16 Cores)</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold mb-2 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Smallholder Farmer Operational Notice</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              AI crop disease classification assists in visual triage. For critical crop fields, confirm symptoms with agricultural extension officers prior to applying expensive commercial fungicides or pesticide treatments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

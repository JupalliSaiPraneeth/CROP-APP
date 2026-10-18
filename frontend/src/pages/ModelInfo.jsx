import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw,
  Terminal,
  Activity,
  Bug,
  Sparkles,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';

export default function ModelInfo() {
  const [selectedModel, setSelectedModel] = useState('crop'); // 'crop' | 'pest' | 'nutrient' | 'yield' | 'price'
  const [cropInfo, setCropInfo] = useState(null);
  const [pestInfo, setPestInfo] = useState(null);
  const [nutrientInfo, setNutrientInfo] = useState(null);
  const [yieldInfo, setYieldInfo] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllInfo() {
      setLoading(true);
      try {
        const [cData, pData, nData, yData, prData] = await Promise.allSettled([
          api.getModelInfo(),
          api.getPestModelInfo(),
          api.getNutrientModelInfo(),
          api.getYieldModelInfo(),
          api.getMarketPriceModelInfo()
        ]);
        if (cData.status === 'fulfilled') setCropInfo(cData.value);
        if (pData.status === 'fulfilled') setPestInfo(pData.value);
        if (nData.status === 'fulfilled') setNutrientInfo(nData.value);
        if (yData.status === 'fulfilled') setYieldInfo(yData.value);
        if (prData.status === 'fulfilled') setPriceInfo(prData.value);
      } catch (err) {
        console.error('Error fetching model metadata:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllInfo();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-forest-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Querying model tensor specifications and metadata...</p>
      </div>
    );
  }

  const isCrop = selectedModel === 'crop';
  const isPest = selectedModel === 'pest';
  const isNutrient = selectedModel === 'nutrient';
  const isYield = selectedModel === 'yield';
  const isPrice = selectedModel === 'price';

  return (
    <div className="space-y-6">
      {/* Model Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedModel('crop')}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
              ${isCrop 
                ? 'bg-forest-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
            `}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MobileNetV3 Crop Disease (38 Cls)</span>
          </button>

          <button
            onClick={() => setSelectedModel('pest')}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
              ${isPest 
                ? 'bg-forest-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
            `}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>YOLO11 Pest Detection (97 Cls)</span>
          </button>

          <button
            onClick={() => setSelectedModel('nutrient')}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
              ${isNutrient 
                ? 'bg-amber-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
            `}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MobileNetV3 Nutrient (36 Cls)</span>
          </button>

          <button
            onClick={() => setSelectedModel('yield')}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
              ${isYield 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
            `}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Random Forest Yield (115 Crops)</span>
          </button>

          <button
            onClick={() => setSelectedModel('price')}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
              ${isPrice 
                ? 'bg-teal-800 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
            `}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Agmarknet Price Engine (13 Crops)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono pr-2">
          {isCrop ? '38 PlantVillage Classes' : isPest ? '97 IP102 Insect Classes' : isNutrient ? '36 OLID-I Indian Crop Classes' : isYield ? '115 Indian Crops & 632 Districts' : '13 Commodities & Historical Mandis'}
        </span>
      </div>


      {isCrop ? (
        /* Crop Disease Model Info */
        <>
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Model Format</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                TensorFlow Lite FlatBuffer
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Optimized for Edge Deployment</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">On-Disk File Size</span>
              <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
                {cropInfo?.model_size_mb || 3.66} MB
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">3,838,400 bytes</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Input Tensor Geometry</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                [1, 224, 224, 3]
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">dtype: {cropInfo?.input_dtype || 'float32'}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Reported Val Accuracy</span>
              <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
                95.54%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">PlantVillage Validation Split</p>
            </div>
          </div>

          {/* Tensor Specifications Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-forest-700" />
                <span>Tensor Flow & Preprocessing Specifications</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Input Dimensions:</span>
                  <span className="font-mono font-bold text-slate-800">224 × 224 RGB (Height × Width × Channels)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Input Scaling:</span>
                  <span className="font-mono font-bold text-forest-800">[0.0, 255.0] float32</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Output Tensor:</span>
                  <span className="font-mono font-bold text-slate-800">[1, 38] float32 (Softmax Probabilities)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Target Mobile Runtime:</span>
                  <span className="font-semibold text-slate-800">Android TFLite Support Library / LiteRT</span>
                </div>
              </div>
            </div>

            {/* Operational Limitations */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Model Limitations</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                As part of sound scientific methodology for our B.Tech engineering evaluation, the following operational boundaries must be acknowledged:
              </p>

              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                <li className="leading-relaxed">
                  <b>Controlled Training Conditions:</b> PlantVillage leaves were mostly photographed individually on laboratory neutral backgrounds. Real farm canopies with overlapping leaves, soil debris, or direct glare may present distribution shift.
                </li>
                <li className="leading-relaxed">
                  <b>Closed Category Assumption:</b> The model is trained on 38 specific labels. It cannot diagnose unknown pests, complex nutrient deficiencies (e.g. Zinc or Boron), or novel plant viruses outside its label dictionary.
                </li>
                <li className="leading-relaxed">
                  <b>Decision Support Only:</b> Predictions represent statistical visual pattern matches and do not replace laboratory PCR assays or official government agricultural extension services.
                </li>
              </ul>
            </div>
          </div>

          {/* Class Dictionary Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Model Output Dictionary (38 Classes in Alphanumeric Sort Order)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Indices 0 through 37 mapped to the model&apos;s categorical probability vector:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {cropInfo?.class_names?.map((name, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400 font-bold w-6">{idx}</span>
                  <span className="text-slate-800 truncate text-right flex-1">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : isPest ? (
        /* YOLO Pest Detection Model Info */
        <>
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Architecture</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                Ultralytics YOLO11n
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Object Detection Backbone</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">On-Disk File Size</span>
              <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
                {pestInfo?.model_size_mb || 5.28} MB
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">best.pt checkpoint</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Input Resolution</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                640 × 640 RGB
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Task: Bounding Box Detection</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Validation mAP@50</span>
              <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
                {pestInfo?.train_metrics?.map50 ? (pestInfo.train_metrics.map50 * 100).toFixed(2) + '%' : '59.67%'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">50 Epochs Training</p>
            </div>
          </div>

          {/* Model Metrics & Architecture Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-forest-700" />
                <span>YOLO11 Detection Architecture & Validation Metrics</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Precision (B):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {pestInfo?.train_metrics?.precision ? (pestInfo.train_metrics.precision * 100).toFixed(2) + '%' : '53.55%'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Recall (B):</span>
                  <span className="font-mono font-bold text-forest-800">
                    {pestInfo?.train_metrics?.recall ? (pestInfo.train_metrics.recall * 100).toFixed(2) + '%' : '60.04%'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">mAP@50-95:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {pestInfo?.train_metrics?.map50_95 ? (pestInfo.train_metrics.map50_95 * 100).toFixed(2) + '%' : '38.87%'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Inference Hardware Mode:</span>
                  <span className="font-semibold text-emerald-800">CPU-Optimized Thread-Safe PyTorch</span>
                </div>
              </div>
            </div>

            {/* IP102 Dataset Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">IP102 Dataset Benchmark</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The pest detection weights (<b>best.pt</b>) were fine-tuned using the IP102 large-scale benchmark for insect pest recognition:
              </p>

              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                <li className="leading-relaxed">
                  <b>Multi-Scale Localization:</b> The model predicts spatial bounding boxes <code>[x1, y1, x2, y2]</code> to locate individual pests and clusters directly within raw field photographs.
                </li>
                <li className="leading-relaxed">
                  <b>97 Detected Classes:</b> Trained across 97 agricultural insect pest categories with Non-Maximum Suppression (NMS) box deduplication.
                </li>
                <li className="leading-relaxed">
                  <b>Direct Edge Inference:</b> Lightweight YOLO11 Nano weights run directly within the local CPU Python environment without requiring dedicated cloud GPU clusters.
                </li>
              </ul>
            </div>
          </div>

          {/* Pest Class Dictionary Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Model Pest Classes ({pestInfo?.num_classes || 97} Categories)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Actual class labels stored directly within <code>best.pt</code> checkpoint metadata:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs max-h-[360px] overflow-y-auto pr-1">
              {pestInfo?.class_names && Object.entries(pestInfo.class_names).map(([cId, name]) => (
                <div key={cId} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400 font-bold">ID {cId}</span>
                  <span className="text-slate-800 font-semibold truncate ml-1">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : isNutrient ? (
        /* Nutrient Deficiency Model Info */
        <>
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Architecture</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                MobileNetV3Small
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Crop-Aware Classifier</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">On-Disk File Size</span>
              <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">
                {nutrientInfo?.model_size_mb || 3.64} MB
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">3,821,180 bytes (TFLite)</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Input Tensor Geometry</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                [1, 224, 224, 3]
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">dtype: float32</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Fine-Tuned Val Accuracy</span>
              <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">
                66.67%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">OLID-I 36-Class Test Split</p>
            </div>
          </div>

          {/* Specifications & Dataset Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-700" />
                <span>Model Pipeline & Layer Topology</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Backbone:</span>
                  <span className="font-mono font-bold text-slate-800">MobileNetV3Small (Functional)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Pooling & Head:</span>
                  <span className="font-mono font-semibold text-slate-800">GlobalAveragePooling2D + Dropout + Dense(36)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Total Parameters:</span>
                  <span className="font-mono font-bold text-slate-800">1,001,438 (3.82 MB)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="text-slate-600 font-medium">Execution Engine:</span>
                  <span className="font-semibold text-emerald-800">TensorFlow Lite XNNPACK CPU Delegate</span>
                </div>
              </div>
            </div>

            {/* OLID-I Dataset Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">OLID-I Indian Crop Dataset</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Trained on the Open Leaf Image Dataset for Indian agricultural cultivars:
              </p>

              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                <li className="leading-relaxed">
                  <b>8 Vegetable Crops:</b> Ash Gourd, Bitter Gourd, Bottle Gourd, Cucumber, Eggplant (Brinjal), Ridge Gourd, Snake Gourd, and Tomato.
                </li>
                <li className="leading-relaxed">
                  <b>Single & Compound Deficiencies:</b> Classifies pure Nitrogen (N), pure Potassium (K), combo N+K, combo K+Mg, combo N+Mg, and healthy balanced foliage.
                </li>
                <li className="leading-relaxed">
                  <b>3,480 Field Leaf Samples:</b> High-resolution authentic field photos with natural lighting, variable shadows, and distinct soil conditions.
                </li>
              </ul>
            </div>
          </div>

          {/* Classification Report Summary Table */}
          {nutrientInfo?.classification_report && Object.keys(nutrientInfo.classification_report).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Fine-Tuned Classification Report Metrics
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Precision, recall, and F1-score evaluated on 348 held-out field test specimens:
              </p>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Class Name</th>
                      <th className="p-2 text-right">Precision</th>
                      <th className="p-2 text-right">Recall</th>
                      <th className="p-2 text-right">F1-Score</th>
                      <th className="p-2 text-right">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {Object.entries(nutrientInfo.classification_report).map(([cls, m]) => (
                      <tr key={cls} className="hover:bg-slate-50/60">
                        <td className="p-2 font-medium font-sans text-slate-800">{cls}</td>
                        <td className="p-2 text-right">{(m.precision * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right">{(m.recall * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right">{(m.f1_score * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right text-slate-400">{m.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 36 Classes Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2">
              All 36 Nutrient Categories ({nutrientInfo?.num_classes || 36} Classes)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Supported diagnostic categories organized by crop and condition:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs max-h-[360px] overflow-y-auto pr-1">
              {nutrientInfo?.class_names && nutrientInfo.class_names.map((name, idx) => (
                <div key={idx} className="p-2 rounded bg-amber-50/40 border border-amber-200/60 flex flex-col justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[9px]">#{idx + 1}</span>
                  <span className="text-slate-900 font-semibold truncate mt-0.5">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : isYield ? (
        /* Crop Yield Random Forest Model Info */
        <>
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Model Algorithm</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                Random Forest Regressor
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">100 Trees &bull; max_depth=20</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Validation R² Score</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {yieldInfo?.metrics?.R2 ? `${(yieldInfo.metrics.R2 * 100).toFixed(1)}%` : '79.2%'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Variance Explained (R²: 0.792)</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Mean Absolute Error (MAE)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {yieldInfo?.metrics?.MAE ? yieldInfo.metrics.MAE.toFixed(2) : '14.25'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tonnes / Hectare MAE</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Artifact File Size</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {yieldInfo?.model_size_mb || '44.66'} <span className="text-xs font-normal text-slate-500">MB</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">joblib Scikit-Learn Pipeline</p>
            </div>
          </div>

          {/* Model Pipeline Specs & Feature Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Pipeline Architecture & Transformations</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-800">1. Categorical Feature Sub-Pipeline</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Features:</b> <code>State_Name</code>, <code>District_Name</code>, <code>Season</code>, <code>Crop</code>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Transformers:</b> <code>SimpleImputer(strategy=&apos;most_frequent&apos;)</code> &rarr; <code>OneHotEncoder(handle_unknown=&apos;ignore&apos;)</code>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-800">2. Numerical Feature Sub-Pipeline</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Features:</b> <code>Crop_Year</code>, <code>Area</code> (Hectares)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Transformers:</b> <code>SimpleImputer(strategy=&apos;mean&apos;)</code>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-800">3. Regression Estimator</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Model:</b> <code>RandomForestRegressor(n_estimators=100, max_depth=20, criterion=&apos;squared_error&apos;)</code>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <b>Target:</b> <code>Yield</code> (Tonnes / Hectare) &rarr; Scaled to Gross Production = Yield &times; Area
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Geographic & Agricultural Scope</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="text-slate-500 text-[11px]">States & UTs Covered</div>
                  <div className="text-xl font-bold text-forest-900 mt-0.5">{yieldInfo?.states_count || 33}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pan-India Coverage</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="text-slate-500 text-[11px]">Districts Covered</div>
                  <div className="text-xl font-bold text-forest-900 mt-0.5">{yieldInfo?.districts_count || 632}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Micro-Geographic Tracts</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="text-slate-500 text-[11px]">Crops Supported</div>
                  <div className="text-xl font-bold text-forest-900 mt-0.5">{yieldInfo?.crops_count || 115}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Cash, Cereals & Fruits</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="text-slate-500 text-[11px]">Seasons Modeled</div>
                  <div className="text-xl font-bold text-forest-900 mt-0.5">{yieldInfo?.seasons_count || 6}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kharif, Rabi, Whole Year</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Operational Robustness:</span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  The model&apos;s OneHotEncoder is fitted with <code>handle_unknown=&apos;ignore&apos;</code>, allowing safe inference even if uncommon spelling variations or unrecorded district names are submitted.
                </p>
              </div>
            </div>
          </div>

          {/* Top Feature Importances */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Top Predictive Factors (Random Forest Gini Feature Importances)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Relative importance contribution of individual one-hot encoded variables and continuous acreage/year features:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(yieldInfo?.top_features || [
                { name: 'Crop_Sugarcane', importance: 0.2746 },
                { name: 'Crop_Coconut', importance: 0.1705 },
                { name: 'Crop_Potato', importance: 0.0760 },
                { name: 'Crop_Banana', importance: 0.0714 },
                { name: 'Crop_Onion', importance: 0.0706 },
                { name: 'Crop_Year', importance: 0.0355 },
                { name: 'Crop_Sweet potato', importance: 0.0334 },
                { name: 'State_Name_Karnataka', importance: 0.0334 },
                { name: 'State_Name_Tamil Nadu', importance: 0.0308 },
                { name: 'Crop_Tapioca', importance: 0.0252 },
                { name: 'State_Name_West Bengal', importance: 0.0198 },
                { name: 'Crop_Jute', importance: 0.0138 }
              ]).slice(0, 14).map((f, i) => {
                const pct = (f.importance * 100).toFixed(1);
                return (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-slate-800 truncate">{f.name.replace('Crop_', 'Crop: ').replace('State_Name_', 'State: ')}</span>
                      <span className="text-forest-700 font-bold shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-forest-700 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(3, f.importance * 300))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : isPrice ? (
        /* Market Price Intelligence Model Info */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Model Architecture</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                Seasonal Decomposition & Econometric Regressor
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Time-Series Forecast Engine</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Directional Trend Accuracy</span>
              <div className="text-2xl font-extrabold text-teal-800 mt-1">
                91.4%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Up/Down market direction</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Forecast Error (MAPE)</span>
              <div className="text-2xl font-extrabold text-teal-800 mt-1">
                6.82%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Mean Absolute % Error</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Benchmark Calibration</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                Agmarknet Mandi Archives
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Ministry of Agriculture, India</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-teal-800" />
              <span>Econometric Pricing Pipeline & Modeling Methodology</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-teal-50/60 border border-teal-100">
                <div className="font-bold text-teal-950">1. Baseline Floor Calibration</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Incorporates Union Government Minimum Support Prices (MSP) and Fair & Remunerative Prices (FRP) as hard price floors below which distress sales are statistically penalized.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-teal-50/60 border border-teal-100">
                <div className="font-bold text-teal-950">2. Arrival Seasonality Decomposition</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Applies multiplicative seasonal indices reflecting Kharif/Rabi harvest influx peaks (supply glut) versus lean summer/monsoon storage depletion phases.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-teal-50/60 border border-teal-100">
                <div className="font-bold text-teal-950">3. Spatial Inter-Mandi Arbitrage</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Calculates regional basis spreads between consumption terminal mandis (e.g. Pune, Bangalore, Delhi) and farmgate APMC production hubs to guide farmers toward optimal selling locations.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

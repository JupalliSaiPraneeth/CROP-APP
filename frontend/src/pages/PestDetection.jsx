import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Bug, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Activity, 
  ChevronRight, 
  Sliders,
  Crosshair,
  Maximize2,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  ArrowRightLeft,
  Sparkles,
  Zap,
  ZoomIn,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function PestDetection({ setActiveTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.15);
  const [iouThreshold, setIouThreshold] = useState(0.60);
  const [imgsz, setImgsz] = useState(1024);
  const [augment, setAugment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedDetectionIdx, setSelectedDetectionIdx] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP, or BMP).');
      return;
    }
    setError(null);
    setResult(null);
    setSelectedDetectionIdx(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const executeDetection = async (overrideConf = null, overrideImgsz = null, overrideAugment = null) => {
    if (!selectedFile || loading) return;
    setLoading(true);
    setError(null);
    try {
      const confToUse = overrideConf !== null ? overrideConf : confidenceThreshold;
      const imgszToUse = overrideImgsz !== null ? overrideImgsz : imgsz;
      const augmentToUse = overrideAugment !== null ? overrideAugment : augment;

      const data = await api.predictPest(
        selectedFile,
        confToUse,
        iouThreshold,
        imgszToUse,
        augmentToUse
      );
      setResult(data);
      setShowOriginal(false);
      setSelectedDetectionIdx(null);
    } catch (err) {
      setError(err.message || 'Pest detection inference failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setSelectedDetectionIdx(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSamplePest = async (sampleName) => {
    try {
      setLoading(true);
      setError(null);
      const url = api.getPestSampleImageUrl(sampleName);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load sample insect photograph');
      const blob = await res.blob();
      const file = new File([blob], `${sampleName}_pest.jpg`, { type: 'image/jpeg' });

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setResult(null);
      setSelectedDetectionIdx(null);
    } catch (err) {
      setError(`Failed to load sample image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applySensitivityPreset = (preset) => {
    if (preset === 'high') {
      setConfidenceThreshold(0.08);
      setImgsz(1024);
      setAugment(true);
    } else if (preset === 'balanced') {
      setConfidenceThreshold(0.15);
      setImgsz(1024);
      setAugment(false);
    } else if (preset === 'precision') {
      setConfidenceThreshold(0.30);
      setImgsz(640);
      setAugment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Context Header & Switcher Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base leading-tight">YOLO11 Pest Detection Studio</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                IP102 Benchmark (best.pt)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Locates bounding boxes, counts insect pests, and identifies species with high-resolution multi-scale inference.
            </p>
          </div>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('detection')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-800 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors border border-forest-200/60 shrink-0 self-start sm:self-auto"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to Crop Disease AI</span>
          </button>
        )}
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Inspection Panel (Left 7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload Field / Crop Photograph</h3>
                <p className="text-xs text-slate-500">Provide a clear photo containing insects or pest damage</p>
              </div>
              {selectedFile && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              )}
            </div>

            {/* Dropzone or Preview */}
            {!previewUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${dragActive 
                    ? 'border-forest-600 bg-forest-50/50' 
                    : 'border-slate-300 hover:border-forest-500 hover:bg-slate-50/50'}
                `}
              >
                <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop field photo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPEG, PNG, WEBP, BMP up to 15MB (Auto-corrects phone orientation)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Display: Annotated vs Original Toggle */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 aspect-video flex items-center justify-center max-h-[380px]">
                  <img
                    src={(!showOriginal && result?.annotated_image) ? result.annotated_image : previewUrl}
                    alt="Pest inspection view"
                    className="max-h-full max-w-full object-contain"
                  />

                  {/* Top-Right Toggle when annotated image exists */}
                  {result?.annotated_image && (
                    <div className="absolute top-2 right-2 flex bg-slate-900/80 p-0.5 rounded-lg backdrop-blur-xs text-[11px] font-medium text-white shadow-xs">
                      <button
                        onClick={() => setShowOriginal(false)}
                        className={`px-2 py-1 rounded-md transition-all ${
                          !showOriginal ? 'bg-forest-700 text-white font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        YOLO Bounding Boxes
                      </button>
                      <button
                        onClick={() => setShowOriginal(true)}
                        className={`px-2 py-1 rounded-md transition-all ${
                          showOriginal ? 'bg-forest-700 text-white font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Original Photo
                      </button>
                    </div>
                  )}

                  {/* Bottom Metadata Pill */}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[11px] font-mono backdrop-blur-xs flex items-center gap-2">
                    <span>{selectedFile?.name}</span>
                    <span className="text-slate-400">({(selectedFile?.size / 1024).toFixed(1)} KB)</span>
                    {result && (
                      <span className="text-emerald-400 font-bold border-l border-slate-700 pl-2">
                        {result.count} {result.count === 1 ? 'Pest' : 'Pests'} Detected
                      </span>
                    )}
                  </div>
                </div>

                {/* Sensitivity Presets Bar */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-forest-700" />
                      Detection Sensitivity Preset:
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Conf: {(confidenceThreshold * 100).toFixed(0)}% | Res: {imgsz}px
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applySensitivityPreset('high')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        confidenceThreshold <= 0.10
                          ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🔍 High Sensitivity (8%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySensitivityPreset('balanced')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        confidenceThreshold > 0.10 && confidenceThreshold <= 0.20
                          ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⚖️ Balanced (15%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySensitivityPreset('precision')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        confidenceThreshold > 0.20
                          ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🎯 High Precision (30%)
                    </button>
                  </div>
                </div>

                {/* Advanced Hyperparameter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Confidence Slider */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="font-semibold text-slate-700">Confidence Cutoff</label>
                      <span className="font-mono font-bold text-forest-800">
                        {(confidenceThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.60"
                      step="0.02"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="w-full accent-forest-700"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Lower if insects are missed</p>
                  </div>

                  {/* Resolution Selector */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="font-semibold text-slate-700">Inference Resolution</label>
                      <span className="font-mono font-bold text-forest-800">{imgsz}px</span>
                    </div>
                    <select
                      value={imgsz}
                      onChange={(e) => setImgsz(parseInt(e.target.value))}
                      className="w-full mt-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-forest-600"
                    >
                      <option value={1024}>1024px (High-Res, Best for Small Pests)</option>
                      <option value={1280}>1280px (Ultra-Res, Maximum Detail)</option>
                      <option value={640}>640px (Standard, Fastest CPU)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Higher res prevents downsampling loss</p>
                  </div>

                  {/* Multi-Scale TTA Toggle */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <label className="font-semibold text-slate-700">Enhanced Recall (TTA)</label>
                        <span className="text-[10px] font-bold uppercase font-mono text-forest-800">
                          {augment ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Multi-scale search for angled or hidden pests
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={augment}
                        onChange={(e) => setAugment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-700"></div>
                      <span className="ml-2 text-xs font-medium text-slate-700">
                        {augment ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={() => executeDetection()}
                  disabled={loading}
                  className={`
                    w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs
                    ${loading 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                      : 'bg-forest-700 hover:bg-forest-800 text-white active:scale-[0.99]'}
                  `}
                >
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin text-slate-500" />
                      Running High-Res YOLO11 Pest Inference ({imgsz}px)...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4" />
                      Detect Pests with YOLO Model
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quick Test Insect Samples */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">Try with verified insect pest photographs:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSamplePest('caterpillar')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors flex items-center gap-1"
                >
                  🐛 Caterpillar
                </button>
                <button
                  type="button"
                  onClick={() => loadSamplePest('beetle')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors flex items-center gap-1"
                >
                  🪲 Crop Beetle
                </button>
                <button
                  type="button"
                  onClick={() => loadSamplePest('locust')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors flex items-center gap-1"
                >
                  🦗 Field Locust
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Detection Error</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Prediction Results Panel (Right 5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Summary Stats Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                      YOLO11 Inference
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {result.count > 0 ? `${result.count} Targets Found` : 'No Detections'}
                    </span>
                    {result.human_detected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-600" /> Human Guard Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{result.inference_time_ms} ms</span>
                  </div>
                </div>

                <div className={`grid ${result.filtered_count > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center pt-1`}>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pest Count</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{result.count}</div>
                  </div>
                  {result.filtered_count > 0 && (
                    <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100">
                      <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Filtered</span>
                      <div className="text-lg font-bold text-sky-800 mt-0.5 font-mono">
                        {result.filtered_count}
                      </div>
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Conf Filter</span>
                    <div className="text-lg font-bold text-forest-800 mt-0.5 font-mono">
                      {(result.confidence_threshold * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resolution</span>
                    <div className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
                      {result.imgsz || 1024}px
                    </div>
                  </div>
                </div>
              </div>

              {/* Human Subject Filter Alert Banner */}
              {result.human_detected && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 shadow-xs text-left space-y-2">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Domain Filter: Human Subject Protected</span>
                    {result.filtered_count > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200/80 text-sky-800">
                        {result.filtered_count} false detection{result.filtered_count > 1 ? 's' : ''} blocked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    A person was identified in this image. To prevent miscalculations on human skin, facial features, hair, or clothing, out-of-domain detections are automatically suppressed.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-sky-700 font-medium">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Upload close-up photos of agricultural crop leaves, plants, or farm insects for accurate analysis.</span>
                  </div>
                </div>
              )}

              {/* Zero Detections Guidance with One-Click Auto Fix (only if not a human subject) */}
              {result.count === 0 && !result.human_detected && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">No Pests Localized at {(confidenceThreshold * 100).toFixed(0)}%</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mt-1">
                      Pests in field photos may be small, partially occluded, or have lower confidence scores.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-left text-xs space-y-2">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Suggested Action:
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Switch to <b>High Sensitivity (8%)</b> with <b>1024px Resolution</b> and <b>Enhanced Recall (TTA)</b> to capture faint and subtle insect targets.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setConfidenceThreshold(0.08);
                        setImgsz(1024);
                        setAugment(true);
                        executeDetection(0.08, 1024, true);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 mt-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-scan with High Sensitivity Mode
                    </button>
                  </div>
                </div>
              )}

              {/* Cropped Pest Inspection Gallery & List */}
              {result.count > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-forest-700" />
                      Localized Insect Targets ({result.count})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {result.image_width} × {result.image_height} px
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {result.detections.map((det, idx) => {
                      const isSelected = selectedDetectionIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDetectionIdx(isSelected ? null : idx)}
                          className={`
                            p-3 rounded-lg border transition-all cursor-pointer text-xs
                            ${isSelected 
                              ? 'border-forest-600 bg-forest-50/60 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {/* Cropped Insect Target Thumbnail */}
                            {det.crop_image ? (
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shrink-0 flex items-center justify-center">
                                <img
                                  src={det.crop_image}
                                  alt={det.display_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-forest-100 text-forest-700 shrink-0 flex items-center justify-center font-bold">
                                #{idx + 1}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate block leading-tight">
                                  {det.display_name}
                                </span>
                                <span className="font-mono font-bold text-slate-900 shrink-0 ml-1">
                                  {det.confidence_percentage.toFixed(1)}%
                                </span>
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                Model Class #{det.class_name} (ID: {det.class_id})
                              </span>

                              {/* Confidence Bar */}
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full ${
                                    det.confidence >= 0.25 ? 'bg-forest-700' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(det.confidence_percentage, 100)}%` }}
                                />
                              </div>

                              {/* Bounding Box Coordinates details */}
                              <div className="mt-1.5 pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>[{det.bbox.x1}, {det.bbox.y1}] → [{det.bbox.x2}, {det.bbox.y2}]</span>
                                <span>{det.bbox.width}×{det.bbox.height} px</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Integrated Pest Management (IPM) Agronomic Advice Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-forest-700" />
                  <h4 className="font-bold text-slate-900 text-xs">Agronomic Pest Management (IPM)</h4>
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p>
                    • <b>Physical Monitoring:</b> Inspect underside of foliage, stems, and flower buds for egg clutches or nymph clusters.
                  </p>
                  <p>
                    • <b>Biological Control:</b> Encourage beneficial predatory species (ladybird beetles, hoverfly larvae, parasitoid wasps).
                  </p>
                  <p>
                    • <b>Cultural Control:</b> Remove infested crop debris, maintain field sanitation, and rotate crops to break pest life cycles.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center h-full min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Bug className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Pest Detection</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload a field photograph on the left and click <b>Detect Pests</b> to run YOLO object detection and view localized bounding boxes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

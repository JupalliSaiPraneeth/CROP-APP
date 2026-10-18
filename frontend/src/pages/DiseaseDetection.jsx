import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Activity, 
  ChevronRight, 
  FileCheck2,
  ShieldCheck,
  Stethoscope,
  Info,
  Bug,
  ArrowRightLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function DiseaseDetection({ setActiveTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [groundTruth, setGroundTruth] = useState('');
  const [threshold, setThreshold] = useState(0.60);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP, or BMP).');
      return;
    }
    setError(null);
    setResult(null);
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

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.predictSingle(
        selectedFile,
        groundTruth.trim() || null,
        threshold
      );
      setResult(data);
    } catch (err) {
      setError(err.message || 'Inference execution failed.');
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
    setGroundTruth('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleImage = async (type) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch sample image directly from test_images via API dataset endpoint or synthetic test
      let filename = type === 'apple' ? 'apple_scab_leaf.jpg' : 'tomato_early_blight_leaf.jpg';
      let expectedLabel = type === 'apple' ? 'Apple___Apple_scab' : 'Tomato___Early_blight';
      
      // Load sample image through local sample endpoint or blob
      const sampleUrl = type === 'apple'
        ? api.getSampleImageUrl('Apple___Apple_scab', '00075aa8-d81a-4184-8541-b692b78d398a___FREC_Scab 3335.JPG')
        : api.getSampleImageUrl('Tomato___Early_blight', '0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B 8389.JPG');

      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error('Could not load sample test leaf');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setGroundTruth(expectedLabel);
      setResult(null);
    } catch (err) {
      setError(`Failed to load sample image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Selection Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base leading-tight">Crop Disease Diagnosis Studio</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                MobileNetV3 TFLite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Classifies foliar diseases across 38 crop categories with agronomic treatment guidance.
            </p>
          </div>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('pest_detection')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-800 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors border border-forest-200/60 shrink-0 self-start sm:self-auto"
          >
            <Bug className="w-3.5 h-3.5 text-forest-700" />
            <span>Switch to Pest Detection (YOLO)</span>
          </button>
        )}
      </div>

      {/* Top action grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Preview Area (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload Leaf Photograph</h3>
                <p className="text-xs text-slate-500">Provide a high-resolution close-up of the suspected crop leaf</p>
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
                  Click to browse or drag and drop leaf photo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPEG, PNG, WEBP, BMP up to 15MB
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
                <div className="relative rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 aspect-video flex items-center justify-center max-h-[340px]">
                  <img
                    src={previewUrl}
                    alt="Selected leaf preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/70 text-white text-[11px] font-mono backdrop-blur-xs">
                    {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                  </div>
                </div>

                {/* Ground Truth & Confidence Tuning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Optional Ground Truth Label (for verification)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apple___Apple_scab"
                      value={groundTruth}
                      onChange={(e) => setGroundTruth(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-forest-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confidence Alert Threshold: {(threshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.40"
                      max="0.90"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      className="w-full accent-forest-700 mt-2"
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleAnalyze}
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
                      Running MobileNetV3 TFLite Inference...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Leaf
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quick Sample Selector */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Try with test dataset samples:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleImage('apple')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors"
                >
                  Apple Scab
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleImage('tomato')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors"
                >
                  Tomato Early Blight
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Error</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Prediction Results Panel (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Primary Diagnosis Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                      TFLite Prediction
                    </span>
                    {result.is_correct !== null && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        result.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {result.is_correct ? 'Matched Ground Truth' : 'Mismatch'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{result.inference_time_ms} ms</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Class</p>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {result.predicted_class}
                  </h3>
                </div>

                {/* Score bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Model Output Confidence</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(result.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.confidence >= 0.85 ? 'bg-emerald-600' :
                        result.confidence >= threshold ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(result.confidence * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                    <span>Confidence Tier: <b>{result.confidence_level}</b></span>
                    <span>TFLite Softmax</span>
                  </div>
                </div>

                {/* Low confidence caution */}
                {result.is_low_confidence && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-950">Low Confidence Prediction ({'<'} {(threshold*100).toFixed(0)}%)</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Please inspect lighting, wipe camera lens, frame a single leaf, or seek physical agricultural extension guidance.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 5 Output Scores */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center justify-between">
                  <span>Top 5 Model Predictions</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ranked Output</span>
                </h4>
                <div className="space-y-2.5">
                  {result.top_predictions.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 truncate max-w-[210px] font-medium">
                          {idx + 1}. {p.class_name}
                        </span>
                        <span className="font-mono text-slate-600 font-semibold">{p.percentage.toFixed(2)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${idx === 0 ? 'bg-forest-700' : 'bg-slate-300'}`}
                          style={{ width: `${Math.min(p.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Agronomic Treatment Card */}
              {result.treatment && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-forest-700" />
                    <h4 className="font-bold text-slate-900 text-xs">Agronomic Guidance & Management</h4>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Field Symptoms</span>
                      <p className="text-slate-700 mt-0.5 leading-relaxed">{result.treatment.symptoms}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Recommended Action Steps</span>
                      <ul className="mt-1 space-y-1 text-slate-700 list-disc list-inside">
                        {result.treatment.management.map((step, i) => (
                          <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center h-full min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Prediction</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload a leaf image on the left and click <b>Analyze Leaf</b> to view the top-5 classification scores and treatment steps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

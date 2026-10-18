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
  Sliders, 
  Sprout, 
  FlaskConical, 
  Droplets, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  RefreshCw, 
  Info, 
  HelpCircle,
  TrendingUp,
  Leaf,
  Atom,
  Check
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_IMAGES = [
  {
    id: 'tomato_nitrogen',
    title: 'Tomato Leaf',
    condition: 'Nitrogen (N) Chlorosis',
    crop: 'Tomato',
    icon: '🍅',
    description: 'Uniform pale yellowing starting from basal leaves'
  },
  {
    id: 'cucumber_potassium',
    title: 'Cucumber Leaf',
    condition: 'Potassium (K) Tip Burn',
    crop: 'Cucumber',
    icon: '🥒',
    description: 'Chlorotic margins turning into brown crispy scorch'
  },
  {
    id: 'tomato_healthy',
    title: 'Tomato Leaf',
    condition: 'Optimal Nutrition (Healthy)',
    crop: 'Tomato',
    icon: '🌱',
    description: 'Vibrant green foliage with balanced NPK physiology'
  }
];

const CROPS_LIST = [
  { id: 'All', name: 'Auto-Detect', icon: '✨' },
  { id: 'Tomato', name: 'Tomato', icon: '🍅' },
  { id: 'Cucumber', name: 'Cucumber', icon: '🥒' },
  { id: 'Eggplant', name: 'Eggplant', icon: '🍆' },
  { id: 'Bitter Gourd', name: 'Bitter Gourd', icon: '🍈' },
  { id: 'Bottle Gourd', name: 'Bottle Gourd', icon: '🌱' },
  { id: 'Ash Gourd', name: 'Ash Gourd', icon: '🌿' },
  { id: 'Ridge Gourd', name: 'Ridge Gourd', icon: '🍃' },
  { id: 'Snake Gourd', name: 'Snake Gourd', icon: '🐍' }
];

export default function NutrientDetection({ setActiveTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [threshold, setThreshold] = useState(0.40);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState('chemical'); // 'chemical', 'organic', 'prevention'
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

    // Auto-detect crop hint from filename
    const fn = file.name.toLowerCase();
    if (fn.includes('tomato')) setSelectedCrop('Tomato');
    else if (fn.includes('cucumber')) setSelectedCrop('Cucumber');
    else if (fn.includes('eggplant') || fn.includes('brinjal')) setSelectedCrop('Eggplant');
    else if (fn.includes('bitter')) setSelectedCrop('Bitter Gourd');
    else if (fn.includes('bottle')) setSelectedCrop('Bottle Gourd');
    else if (fn.includes('ash')) setSelectedCrop('Ash Gourd');
    else if (fn.includes('ridge')) setSelectedCrop('Ridge Gourd');
    else if (fn.includes('snake')) setSelectedCrop('Snake Gourd');
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

  const handleAnalyze = async (overrideCrop = null) => {
    if (!selectedFile) {
      setError('Please select or upload a leaf photograph first.');
      return;
    }

    setLoading(true);
    setError(null);

    const activeCrop = overrideCrop || selectedCrop;
    const cropFilter = activeCrop !== 'All' ? activeCrop.toLowerCase().replace(/\s+/g, '_') : null;

    try {
      const data = await api.predictNutrient(
        selectedFile,
        null,
        threshold,
        cropFilter
      );
      setResult(data);
    } catch (err) {
      setError(err.message || 'Nutrient deficiency analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = (cropId) => {
    setSelectedCrop(cropId);
    if (selectedFile) {
      // Re-run analysis with newly selected crop
      handleAnalyze(cropId);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSample = async (sample) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCrop(sample.crop);

      const url = api.getNutrientSampleImageUrl(sample.id);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load sample leaf photograph');
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));

      // Immediately run diagnosis with the authentic sample crop context
      const cropFilter = sample.crop.toLowerCase().replace(/\s+/g, '_');
      const data = await api.predictNutrient(file, null, threshold, cropFilter);
      setResult(data);
    } catch (err) {
      setError(`Failed to load sample image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner with Agronomic Clarification */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-emerald-950 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-emerald-400/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Model #3 • OLID-I Indian Crops
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                MobileNetV3 TFLite • 36 Categories
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Plant Nutrient Deficiency Diagnostic AI</h1>
            <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
              Detects Nitrogen (N), Potassium (K), and Magnesium (Mg) macronutrient deficiencies in gourds and solanaceous crops with targeted foliar and organic fertilizer prescriptions.
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/30 border border-amber-400/30 text-[11px] text-amber-200/90 font-medium">
              <Atom className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>NPK Science Note:</strong> 'K' stands for elemental <strong>Potassium (Kalium)</strong> from fertilizers, <em>not human Vitamin K</em>. Plants do not experience Vitamin K deficiency.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('model_info')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" /> Model Specs
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls vs Result Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Quick Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick-test Presets Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-amber-600" /> One-Click Diagnostic Samples
              </h3>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Instant Auto-Test
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => loadSample(sample)}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left flex flex-col justify-between group disabled:opacity-50"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 group-hover:text-amber-800 line-clamp-1">
                      <span>{sample.icon}</span>
                      <span>{sample.crop}</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-medium line-clamp-1 mt-0.5">
                      {sample.condition}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-2 flex items-center gap-0.5 group-hover:text-amber-700 font-semibold">
                    Diagnose <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone & Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            {/* Visual Crop Selector Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" /> Select Crop Context:
                </label>
                <span className="text-[10px] text-slate-500">Essential for High Accuracy</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CROPS_LIST.map((c) => {
                  const isSelected = selectedCrop === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCropSelect(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                ${dragActive 
                  ? 'border-amber-500 bg-amber-50/40' 
                  : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50/60'}
                ${previewUrl ? 'bg-slate-50' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Uploaded leaf"
                    className="max-h-56 mx-auto rounded-lg object-contain shadow-xs"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 rounded">
                      Click to Replace
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-5 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Drop leaf photo here or <span className="text-amber-700 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP • Auto-deduces crop from filename
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Threshold Slider */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Confidence Threshold Gate
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.85"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !selectedFile}
                className="flex-1 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Nutrients...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Run Nutrient Analysis</span>
                  </>
                )}
              </button>

              {selectedFile && (
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-all"
                  title="Clear image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic & Treatment Prescription (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Primary Diagnostic Banner */}
              <div className={`rounded-xl border p-5 shadow-xs ${
                result.is_healthy 
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-emerald-200' 
                  : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border-amber-300'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl shadow-xs text-white ${
                      result.is_healthy ? 'bg-emerald-600' : 'bg-amber-700'
                    }`}>
                      {result.is_healthy ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Droplets className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {result.crop_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          result.is_healthy 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {result.deficiency_title}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mt-1">
                        {result.remedy?.deficiency_title || result.deficiency_title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {result.remedy?.primary_symptom}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                      result.confidence_level === 'High' ? 'bg-emerald-100 text-emerald-800' :
                      result.confidence_level === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {result.confidence_level} Confidence
                    </span>
                  </div>
                </div>

                {/* Educational Banner for Potassium (K) */}
                {result.predicted_class.includes('__K') && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
                    <Atom className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Agronomic Clarity: Potassium (K) Macronutrient Deficiency</span>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        In agricultural science, <strong>'K'</strong> designates elemental <strong>Potassium (Kalium)</strong> from N-P-K fertilizer. This regulates osmotic pressure and fruit firming. <em>Plants do not have Vitamin K deficiency.</em>
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Status Bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-center">
                  <div className="bg-white/70 backdrop-blur-xs rounded-lg p-2 border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inference Speed</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{result.inference_time_ms} ms</span>
                  </div>
                  <div className="bg-white/70 backdrop-blur-xs rounded-lg p-2 border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nutrients Affected</span>
                    <span className="text-xs font-bold text-amber-900">
                      {result.nutrient_element || result.remedy?.nutrients_involved?.join(', ') || 'None'}
                    </span>
                  </div>
                  <div className="bg-white/70 backdrop-blur-xs rounded-lg p-2 border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Crop Context</span>
                    <span className="text-xs font-bold text-slate-800">
                      {result.crop_name.split('(')[0].trim()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Elemental Nutrient Breakdown Card */}
              {result.nutrient_breakdown && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <Atom className="w-4 h-4 text-amber-600" /> Elemental Macronutrient Profile
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Global 36-Class Multi-Nutrient Assessment
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60">
                      <span className="text-[10px] font-semibold text-blue-700 uppercase block">Nitrogen (N)</span>
                      <span className="text-lg font-black text-blue-950 font-mono">
                        {result.nutrient_breakdown.nitrogen_n}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60">
                      <span className="text-[10px] font-semibold text-amber-700 uppercase block">Potassium (K)</span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        {result.nutrient_breakdown.potassium_k}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200/60">
                      <span className="text-[10px] font-semibold text-purple-700 uppercase block">Magnesium (Mg)</span>
                      <span className="text-lg font-black text-purple-950 font-mono">
                        {result.nutrient_breakdown.magnesium_mg}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Balanced Healthy</span>
                      <span className="text-lg font-black text-emerald-950 font-mono">
                        {result.nutrient_breakdown.healthy_balance}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment & Prescription Tabs */}
              {result.remedy && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-emerald-600" /> Agronomic Remedial Protocol
                    </h3>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveInfoTab('chemical')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          activeInfoTab === 'chemical' 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Foliar / Chemical
                      </button>
                      <button
                        onClick={() => setActiveInfoTab('organic')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          activeInfoTab === 'organic' 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Organic Soil
                      </button>
                      <button
                        onClick={() => setActiveInfoTab('prevention')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          activeInfoTab === 'prevention' 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Prevention
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents */}
                  <div className="min-h-[140px]">
                    {activeInfoTab === 'chemical' && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 italic mb-2">
                          Direct foliar sprays for rapid leaf assimilation and urgent recovery:
                        </p>
                        {result.remedy.chemical_remedies.map((remedy, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-amber-50/40 border border-amber-200/50 rounded-lg text-xs text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{remedy}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeInfoTab === 'organic' && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 italic mb-2">
                          Sustainable biological amendments for long-term root zone fertility:
                        </p>
                        {result.remedy.organic_remedies.map((remedy, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-emerald-50/40 border border-emerald-200/50 rounded-lg text-xs text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{remedy}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeInfoTab === 'prevention' && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 italic mb-2">
                          Preventive soil moisture, pH balancing, and fertigation scheduling:
                        </p>
                        {result.remedy.prevention.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top-5 Predictions Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-slate-500" /> Probability Distribution (Top 5 Classes)
                </h3>
                <div className="space-y-2.5">
                  {result.top_predictions.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {p.crop_display}: <span className="text-amber-800 font-normal">{p.condition}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700">{p.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 
                              ? 'bg-amber-600' 
                              : idx === 1 
                              ? 'bg-amber-400' 
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.max(p.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Leaf className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Awaiting Leaf Photograph</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Choose your crop from the bar on the left, upload a field leaf photo, or click any of the 3 one-click sample presets for instant verification.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2 py-1 bg-slate-100 rounded">8 Vegetable Crops</span>
                <span className="px-2 py-1 bg-slate-100 rounded">N, K, Mg Deficiencies</span>
                <span className="px-2 py-1 bg-slate-100 rounded">NPK Foliar Protocols</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

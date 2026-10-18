import React, { useState } from 'react';
import { 
  FlaskConical, 
  Files, 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  FileText, 
  Check, 
  X,
  Upload,
  Activity,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';

export default function ModelTesting({ setActiveTab }) {
  const [testMode, setTestMode] = useState('dataset'); // 'dataset', 'batch', 'single'
  
  // Dataset evaluation state
  const [samplesPerClass, setSamplesPerClass] = useState(5);
  const [maxTotalSamples, setMaxTotalSamples] = useState(190);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState(null);

  // Batch evaluation state
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState(null);

  const handleRunDatasetEval = async () => {
    setEvalLoading(true);
    setEvalError(null);
    try {
      const data = await api.runEvaluation({
        samples_per_class: samplesPerClass,
        max_total_samples: maxTotalSamples,
        source_folder: "PlantVillage"
      });
      setEvalResult(data);
    } catch (err) {
      setEvalError(err.message || 'Dataset evaluation failed.');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleBatchFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 50) {
      setBatchError('Maximum 50 images allowed per batch test.');
      setBatchFiles(files.slice(0, 50));
    } else {
      setBatchError(null);
      setBatchFiles(files);
    }
    setBatchResult(null);
  };

  const handleRunBatchTest = async () => {
    if (!batchFiles.length) return;
    setBatchLoading(true);
    setBatchError(null);
    try {
      const data = await api.predictBatch(batchFiles);
      setBatchResult(data);
    } catch (err) {
      setBatchError(err.message || 'Batch prediction failed.');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setTestMode('dataset')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            testMode === 'dataset'
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Automated Dataset Benchmark</span>
        </button>

        <button
          onClick={() => setTestMode('batch')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            testMode === 'batch'
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Files className="w-4 h-4" />
          <span>Multi-Image Batch Testing</span>
        </button>
      </div>

      {/* Mode C: Dataset Evaluation */}
      {testMode === 'dataset' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Automated Test Split Benchmark</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              This testing tool samples independent images from the 38 plant disease classes located under 
              <code className="text-slate-700 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded mx-1">
                datasets/PlantVillage/extracted/raw/color
              </code>
              and computes true Accuracy, Precision, Recall, Macro F1, and Confusion Matrix using scikit-learn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Samples per Class: <span className="text-forest-700 font-bold">{samplesPerClass}</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={samplesPerClass}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSamplesPerClass(val);
                    setMaxTotalSamples(val * 38);
                  }}
                  className="w-full accent-forest-700"
                />
                <p className="text-[11px] text-slate-400 mt-1">Samples drawn from distinct test partitions</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Total Test Images: <span className="font-mono text-slate-900 font-bold">{maxTotalSamples}</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-2">
                  Standard test run with {samplesPerClass} images × 38 categories = {maxTotalSamples} actual TFLite inferences.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={handleRunDatasetEval}
                disabled={evalLoading}
                className={`
                  px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs
                  ${evalLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-forest-700 hover:bg-forest-800 text-white'}
                `}
              >
                {evalLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Evaluating {maxTotalSamples} Test Images...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Model Benchmark Test
                  </>
                )}
              </button>

              {evalResult && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1"
                >
                  View Full Classification Report <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {evalError && (
              <div className="mt-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{evalError}</span>
              </div>
            )}
          </div>

          {/* Result Summary Cards if evaluated */}
          {evalResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Test Set Accuracy</span>
                  <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
                    {(evalResult.accuracy * 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Scikit-learn calculated</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Macro F1-Score</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {(evalResult.f1_macro * 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Unweighted class average</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Weighted Recall</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {(evalResult.recall_weighted * 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Support weighted</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Avg Latency / Sample</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {evalResult.avg_inference_time_ms} ms
                  </div>
                  <span className="text-[10px] text-slate-400">{evalResult.total_samples} test samples</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Full Diagnostic Charts Generated</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confusion matrix heatmap and per-class classification report are ready for inspection and PDF download.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 shadow-xs"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Open Reports
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Multi-Image Batch Testing */}
      {testMode === 'batch' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Batch Image Testing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select multiple leaf photos to execute high-throughput batch classification.
            </p>

            <div className="mt-4">
              <label className="block p-6 border-2 border-dashed border-slate-300 rounded-xl text-center cursor-pointer hover:border-forest-500 hover:bg-slate-50/50 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {batchFiles.length ? `${batchFiles.length} images selected` : 'Select up to 50 leaf images'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/bmp"
                  onChange={handleBatchFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {batchFiles.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Ready to process {batchFiles.length} files
                </span>
                <button
                  onClick={handleRunBatchTest}
                  disabled={batchLoading}
                  className="px-5 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {batchLoading ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      Running Inference...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Process Batch
                    </>
                  )}
                </button>
              </div>
            )}

            {batchError && (
              <p className="text-xs text-rose-600 mt-3">{batchError}</p>
            )}
          </div>

          {/* Batch results table */}
          {batchResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Batch Results Summary</h4>
                  <p className="text-xs text-slate-500">
                    Processed {batchResult.total_images} images in avg {batchResult.avg_inference_time_ms} ms/image
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-y border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Filename</th>
                      <th className="py-2.5 px-3">Predicted Class</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {batchResult.results.map((res, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[150px]">{res.filename}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{res.predicted_class}</td>
                        <td className="py-2 px-3 font-mono font-medium">{(res.confidence * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-slate-500">{res.inference_time_ms} ms</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            res.confidence >= 0.85 ? 'bg-emerald-50 text-emerald-700' :
                            res.confidence >= 0.60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {res.confidence_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

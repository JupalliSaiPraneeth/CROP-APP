import React, { useEffect, useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  FileJson, 
  BarChart3, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Clock, 
  HelpCircle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';

export default function EvaluationReports({ setActiveTab }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getEvaluationResults();
      setReport(data);
    } catch (err) {
      console.error(err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-forest-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading evaluation metrics and matrix...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">No Evaluation Results Found</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          You haven't run an automated model evaluation test yet in this workspace. Run a test benchmark to generate accuracy metrics, confusion matrices, and downloadable reports.
        </p>
        <button
          onClick={() => setActiveTab('testing')}
          className="mt-5 px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Go to Model Testing Studio
        </button>
      </div>
    );
  }

  // Prepare chart data from classification report
  const rawReport = report.classification_report || {};
  const chartData = Object.entries(rawReport)
    .filter(([key, val]) => typeof val === 'object' && !['accuracy', 'macro avg', 'weighted avg'].includes(key))
    .map(([key, val]) => {
      const shortName = key.replace('___', ' : ').replace(/_/g, ' ');
      const crop = key.split('___')[0].replace(/_/g, ' ');
      return {
        fullName: key,
        displayName: shortName.length > 28 ? shortName.slice(0, 26) + '...' : shortName,
        crop: crop,
        f1: Math.round((val['f1-score'] || 0) * 100),
        precision: Math.round((val['precision'] || 0) * 100),
        recall: Math.round((val['recall'] || 0) * 100),
        support: val['support'] || 0
      };
    });

  const availableCrops = ['All', ...Array.from(new Set(chartData.map(d => d.crop)))].sort();
  const filteredChartData = selectedCropFilter === 'All' 
    ? chartData 
    : chartData.filter(d => d.crop === selectedCropFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
              Verified Evaluation
            </span>
            <span className="text-xs text-slate-400 font-mono">Date: {report.evaluation_date}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            MobileNetV3 Classification Metrics on Test Split ({report.total_samples} samples)
          </h3>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getExportPdfUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PDF Report
          </a>

          <a
            href={api.getExportClassificationReportUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Metrics CSV
          </a>

          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> History CSV
          </a>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Overall Accuracy</span>
          <div className="text-xl font-bold text-forest-800 mt-1 font-mono">
            {(report.accuracy * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Macro Precision</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {(report.precision_macro * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Macro Recall</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {(report.recall_macro * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Macro F1</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {(report.f1_macro * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Weighted F1</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {(report.f1_weighted * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Avg Latency</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {report.avg_inference_time_ms} ms
          </div>
        </div>
      </div>

      {/* Per-Class F1 Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Per-Class F1-Score Performance</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Harmonic mean of precision and recall for each plant disease class
            </p>
          </div>

          {/* Crop filter pill selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium mr-1">Crop:</span>
            {availableCrops.slice(0, 7).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCropFilter(c)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedCropFilter === c
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredChartData.slice(0, 16)} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayName" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                angle={-30} 
                textAnchor="end" 
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                        <p className="font-bold text-emerald-400">{d.fullName}</p>
                        <p>F1-Score: <b>{d.f1}%</b></p>
                        <p>Precision: <b>{d.precision}%</b> | Recall: <b>{d.recall}%</b></p>
                        <p className="text-slate-400">Tested samples: {d.support}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="f1" fill="#15803d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Class Metrics Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-4">Detailed Classification Report</h4>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Class Name</th>
                <th className="py-2.5 px-3">Crop</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3 text-right">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredChartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="py-2 px-3">{row.crop}</td>
                  <td className="py-2 px-3 font-mono">{row.precision}%</td>
                  <td className="py-2 px-3 font-mono">{row.recall}%</td>
                  <td className="py-2 px-3 font-mono font-bold text-forest-800">{row.f1}%</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">{row.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

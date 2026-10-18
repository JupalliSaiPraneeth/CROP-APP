import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Info 
} from 'lucide-react';
import { api, setBaseUrl } from '../services/api';

export default function Settings({ onRefreshHealth, health }) {
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [savedMessage, setSavedMessage] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setBaseUrl(apiUrl.trim());
    setSavedMessage('API Base URL saved successfully!');
    if (onRefreshHealth) onRefreshHealth();
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear session prediction history?')) return;
    setClearing(true);
    try {
      await api.clearHistory();
      setSavedMessage('Prediction history cleared.');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err) {
      alert(`Error clearing history: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Backend Connection Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-forest-700" />
          <span>Backend Connection Settings</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Configure the REST API endpoint connecting the web dashboard to FastAPI.
        </p>

        <form onSubmit={handleSaveUrl} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Backend API Base URL
              </label>
              {import.meta.env.VITE_API_URL && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  Env: {import.meta.env.VITE_API_URL}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-backend.onrender.com or http://127.0.0.1:8001"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Save URL
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Local default: <code className="text-slate-600">http://127.0.0.1:8001</code> | Cloud format: <code className="text-slate-600">https://your-app.onrender.com</code></span>
              <button
                type="button"
                onClick={() => {
                  setApiUrl("http://127.0.0.1:8001");
                  setBaseUrl("");
                  setSavedMessage("Reset to local default (http://127.0.0.1:8001)");
                  if (onRefreshHealth) onRefreshHealth();
                  setTimeout(() => setSavedMessage(null), 3000);
                }}
                className="text-forest-700 hover:underline font-medium"
              >
                Reset Default
              </button>
            </div>
          </div>
        </form>

        {savedMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* Session Data Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Session Data Management</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Clear temporary in-memory predictions logged during this testing session.
        </p>

        <button
          onClick={handleClearHistory}
          disabled={clearing}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {clearing ? 'Clearing...' : 'Clear Session Prediction History'}
        </button>
      </div>

      {/* System Information */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-500" />
          <span>Workspace Environment</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px]">Machine Architecture</span>
            <p className="font-semibold text-slate-800 mt-0.5">Windows 11 (Intel 12th Gen i5-12500H, 16 Cores)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px]">Frontend Stack</span>
            <p className="font-semibold text-slate-800 mt-0.5">React 18 + Vite 5 + Tailwind CSS + Recharts</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px]">Backend Runtime</span>
            <p className="font-semibold text-slate-800 mt-0.5">Python 3.13 + FastAPI + Uvicorn</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px]">Inference Engine</span>
            <p className="font-semibold text-slate-800 mt-0.5">TensorFlow Lite (XNNPACK CPU)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './pages/Overview';
import DiseaseDetection from './pages/DiseaseDetection';
import PestDetection from './pages/PestDetection';
import NutrientDetection from './pages/NutrientDetection';
import CropYieldPrediction from './pages/CropYieldPrediction';
import MarketPricePrediction from './pages/MarketPricePrediction';
import ModelTesting from './pages/ModelTesting';
import EvaluationReports from './pages/EvaluationReports';
import DatasetExplorer from './pages/DatasetExplorer';
import ModelInfo from './pages/ModelInfo';
import Settings from './pages/Settings';
import { api } from './services/api';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const checkHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'disconnected', model_loaded: false, error: err.message });
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll health status every 15 seconds
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview health={health} setActiveTab={setActiveTab} />;
      case 'detection':
        return <DiseaseDetection setActiveTab={setActiveTab} />;
      case 'pest_detection':
        return <PestDetection setActiveTab={setActiveTab} />;
      case 'nutrient_deficiency':
        return <NutrientDetection setActiveTab={setActiveTab} />;
      case 'yield_prediction':
        return <CropYieldPrediction setActiveTab={setActiveTab} />;
      case 'market_price':
        return <MarketPricePrediction setActiveTab={setActiveTab} />;
      case 'testing':
        return <ModelTesting setActiveTab={setActiveTab} />;
      case 'reports':
        return <EvaluationReports setActiveTab={setActiveTab} />;
      case 'dataset':
        return <DatasetExplorer setActiveTab={setActiveTab} />;
      case 'model_info':
        return <ModelInfo />;
      case 'settings':
        return <Settings health={health} onRefreshHealth={checkHealth} />;
      default:
        return <Overview health={health} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Desktop / Responsive Mobile Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          health={health}
          onRefreshHealth={checkHealth}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' && 
           (api.getBaseUrl().includes('127.0.0.1') || api.getBaseUrl().includes('localhost')) && 
           health?.status === 'disconnected' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Cloud Deployment Notice:</strong> Frontend is live on <code className="font-mono font-semibold">{window.location.hostname}</code>, but backend endpoint is currently set to <code className="font-mono font-semibold">{api.getBaseUrl()}</code>.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs self-start sm:self-auto transition-colors shrink-0"
              >
                <span>Connect Live Backend</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

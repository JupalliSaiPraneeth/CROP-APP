import React from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  Bug,
  Sparkles,
  FlaskConical, 
  FileSpreadsheet, 
  Layers, 
  Cpu, 
  Settings, 
  Sprout, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  IndianRupee
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'detection', label: 'Disease Detection', icon: ScanLine },
  { id: 'pest_detection', label: 'Pest Detection', icon: Bug },
  { id: 'nutrient_deficiency', label: 'Nutrient Deficiency', icon: Sparkles },
  { id: 'yield_prediction', label: 'Crop Yield AI', icon: TrendingUp },
  { id: 'market_price', label: 'Market Price AI', icon: IndianRupee, badge: 'Advanced' },
  { id: 'testing', label: 'Model Testing', icon: FlaskConical },
  { id: 'reports', label: 'Evaluation Reports', icon: FileSpreadsheet },
  { id: 'dataset', label: 'Dataset Explorer', icon: Layers },
  { id: 'model_info', label: 'Model Information', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, health, isMobileOpen, setIsMobileOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">CropAI Ecosystem</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">5-Model AgTech Suite</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-forest-50 text-forest-800 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-forest-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-forest-200 text-forest-900' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quintuple Model Status Pill */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
          {/* TFLite Crop Disease Model */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health?.model_loaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-700">Crop Disease</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">38 Classes</span>
          </div>

          {/* YOLO Pest Model */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health?.pest_model_loaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-700">Pest Detection</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium font-mono">
              {health?.pest_model_loaded ? '97 Cls (YOLO)' : 'Offline'}
            </span>
          </div>

          {/* Nutrient Deficiency Model */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health?.nutrient_model_loaded !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-700">Nutrient AI</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium font-mono">
              36 Cls (OLID-I)
            </span>
          </div>

          {/* Crop Yield Model */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health?.yield_model_loaded !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-700">Yield AI</span>
            </div>
            <span className="text-[10px] text-forest-700 font-medium font-mono">
              115 Crops (RF)
            </span>
          </div>

          {/* Market Price Model */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-700">Market Price</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium font-mono">
              13 Crops (Agmark)
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sprout, 
  MapPin, 
  Calendar, 
  Ruler, 
  IndianRupee, 
  Sparkles, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Trash2, 
  BarChart3, 
  RefreshCw, 
  Info,
  ChevronRight,
  Share2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { STATE_DISTRICTS } from '../data/stateDistricts';

export default function CropYieldPrediction({ setActiveTab }) {
  const [categories, setCategories] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Active sub-mode: 'single' | 'simulate' | 'portfolio'
  const [mode, setMode] = useState('single');

  // Single plot form state
  const [stateName, setStateName] = useState('Maharashtra');
  const [districtName, setDistrictName] = useState('KOLHAPUR');
  const [season, setSeason] = useState('Whole Year');
  const [crop, setCrop] = useState('Sugarcane');
  const [cropYear, setCropYear] = useState(2024);
  const [area, setArea] = useState(25.0);
  const [areaUnit, setAreaUnit] = useState('hectares'); // 'hectares' | 'acres'
  const [marketPrice, setMarketPrice] = useState(3200); // ₹ per Tonne (default sugarcane FRP approx)

  // Filter/search helpers
  const [cropSearch, setCropSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  // Result state
  const [prediction, setPrediction] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingAutoPrice, setLoadingAutoPrice] = useState(false);
  const [error, setError] = useState(null);

  // Simulation state
  const [simulations, setSimulations] = useState([]);
  const [loadingSim, setLoadingSim] = useState(false);

  // Portfolio / Batch state
  const [portfolioPlots, setPortfolioPlots] = useState([
    { id: '1', plot_name: 'North Valley Field', state: 'Maharashtra', district: 'KOLHAPUR', season: 'Whole Year', crop: 'Sugarcane', area: 20.0, crop_year: 2024 },
    { id: '2', plot_name: 'Canal Basin Plot', state: 'Maharashtra', district: 'KOLHAPUR', season: 'Kharif', crop: 'Rice', area: 10.0, crop_year: 2024 },
    { id: '3', plot_name: 'East Ridge Block', state: 'Maharashtra', district: 'KOLHAPUR', season: 'Rabi', crop: 'Wheat', area: 8.0, crop_year: 2024 }
  ]);
  const [batchResult, setBatchResult] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  // Fetch categories and presets on mount
  useEffect(() => {
    async function loadInitial() {
      setLoadingCats(true);
      try {
        const catData = await api.getYieldCategories();
        setCategories(catData);
        setPresets(catData.presets || []);

        const validState = (catData.states?.length && !catData.states.includes(stateName))
          ? catData.states[0]
          : stateName;
        if (validState !== stateName) {
          setStateName(validState);
        }

        const mapping = catData.state_districts || STATE_DISTRICTS;
        const validDistricts = mapping?.[validState] || [];
        if (validDistricts.length > 0 && !validDistricts.includes(districtName)) {
          setDistrictName(validDistricts[0]);
        }

        if (catData.crops?.length && !catData.crops.includes(crop)) {
          setCrop(catData.crops[0]);
        }
      } catch (err) {
        console.error('Failed to load yield categories:', err);
        setError('Could not load categories metadata from backend.');
      } finally {
        setLoadingCats(false);
      }
    }
    loadInitial();
  }, []);

  // Helper to get districts strictly for a given state
  const getDistrictsForState = (st) => {
    if (!st) return [];
    const cleanState = st.trim();

    // 1. Check categories.state_districts from backend API
    if (categories?.state_districts) {
      if (categories.state_districts[cleanState] && categories.state_districts[cleanState].length > 0) {
        return categories.state_districts[cleanState];
      }
      const lower = cleanState.toLowerCase();
      for (const [k, v] of Object.entries(categories.state_districts)) {
        if (k.toLowerCase() === lower && Array.isArray(v) && v.length > 0) {
          return v;
        }
      }
    }

    // 2. Check bundled static STATE_DISTRICTS
    if (STATE_DISTRICTS) {
      if (STATE_DISTRICTS[cleanState] && STATE_DISTRICTS[cleanState].length > 0) {
        return STATE_DISTRICTS[cleanState];
      }
      const lower = cleanState.toLowerCase();
      for (const [k, v] of Object.entries(STATE_DISTRICTS)) {
        if (k.toLowerCase() === lower && Array.isArray(v) && v.length > 0) {
          return v;
        }
      }
    }

    // Return empty list so non-state districts are NEVER shown
    return [];
  };

  // Ensure districtName ALWAYS belongs to the currently selected stateName
  useEffect(() => {
    const validDists = getDistrictsForState(stateName);
    if (validDists.length > 0 && !validDists.includes(districtName)) {
      setDistrictName(validDists[0]);
    }
  }, [stateName, categories]);

  // Handle State selection change - automatically selects valid district
  const handleStateChange = (newState) => {
    setStateName(newState);
    setDistrictSearch('');
    const available = getDistrictsForState(newState);
    if (available.length > 0 && !available.includes(districtName)) {
      setDistrictName(available[0]);
    }
  };

  // Handle Preset selection
  const handleApplyPreset = (p) => {
    setStateName(p.state);
    setDistrictName(p.district);
    setDistrictSearch('');
    setSeason(p.season);
    setCrop(p.crop);
    setCropYear(p.crop_year || 2024);
    setArea(p.area);
    setAreaUnit('hectares');
    setError(null);

    // Set sample market price based on crop
    const cLow = p.crop.toLowerCase();
    if (cLow.includes('sugar')) setMarketPrice(3200);
    else if (cLow.includes('rice')) setMarketPrice(24000);
    else if (cLow.includes('wheat')) setMarketPrice(22750);
    else if (cLow.includes('potato')) setMarketPrice(14000);
    else if (cLow.includes('cotton')) setMarketPrice(71220);
    else if (cLow.includes('maize')) setMarketPrice(20900);
    else setMarketPrice(15000);
  };

  // Auto-fetch market price using Market Price AI
  const handleAutoFetchPrice = async () => {
    setLoadingAutoPrice(true);
    try {
      const res = await api.predictMarketPrice({
        commodity: crop,
        state: stateName,
        crop_year: Number(cropYear)
      });
      if (res && res.predicted_price_tonne) {
        setMarketPrice(res.predicted_price_tonne);
      }
    } catch (err) {
      console.warn('Auto price fetch failed:', err);
    } finally {
      setLoadingAutoPrice(false);
    }
  };

  // Run single prediction
  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoadingPredict(true);
    setError(null);

    const areaInHa = areaUnit === 'acres' ? Number(area) / 2.47105 : Number(area);

    if (isNaN(areaInHa) || areaInHa <= 0) {
      setError('Please provide a valid land area greater than 0.');
      setLoadingPredict(false);
      return;
    }

    try {
      const res = await api.predictYield({
        state: stateName,
        district: districtName,
        season,
        crop,
        crop_year: Number(cropYear),
        area: Math.round(areaInHa * 100) / 100
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Yield prediction failed');
    } finally {
      setLoadingPredict(false);
    }
  };

  // Run scenario simulation
  const handleSimulate = async () => {
    setLoadingSim(true);
    setError(null);
    const areaInHa = areaUnit === 'acres' ? Number(area) / 2.47105 : Number(area);
    try {
      const data = await api.simulateYieldScenarios(stateName, districtName, areaInHa, Number(cropYear));
      setSimulations(data.scenarios || []);
    } catch (err) {
      setError(err.message || 'Scenario simulation failed');
    } finally {
      setLoadingSim(false);
    }
  };

  // Run batch portfolio estimation
  const handleRunPortfolio = async () => {
    setLoadingBatch(true);
    setError(null);
    try {
      const items = portfolioPlots.map((p) => ({
        plot_name: p.plot_name,
        state: p.state,
        district: p.district,
        season: p.season,
        crop: p.crop,
        crop_year: Number(p.crop_year),
        area: Number(p.area)
      }));
      const res = await api.predictYieldBatch(items);
      setBatchResult(res);
    } catch (err) {
      setError(err.message || 'Portfolio batch estimation failed');
    } finally {
      setLoadingBatch(false);
    }
  };

  const addPortfolioPlot = () => {
    const nextId = (portfolioPlots.length + 1).toString();
    setPortfolioPlots([
      ...portfolioPlots,
      {
        id: nextId,
        plot_name: `Parcel #${nextId}`,
        state: stateName,
        district: districtName,
        season: 'Kharif',
        crop: 'Rice',
        area: 15.0,
        crop_year: 2024
      }
    ]);
  };

  const removePortfolioPlot = (id) => {
    if (portfolioPlots.length <= 1) return;
    setPortfolioPlots(portfolioPlots.filter(p => p.id !== id));
  };

  const updatePortfolioPlot = (id, field, value) => {
    setPortfolioPlots(portfolioPlots.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Filtered dropdown lists
  const filteredCrops = categories?.crops
    ? categories.crops.filter(c => c.toLowerCase().includes(cropSearch.toLowerCase()))
    : [];

  const currentDistricts = getDistrictsForState(stateName);
  const filteredDistricts = currentDistricts.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const areaInHa = areaUnit === 'acres' ? Number(area) / 2.47105 : Number(area);
  const areaInAcres = areaUnit === 'acres' ? Number(area) : Number(area) * 2.47105;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-forest-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 backdrop-blur-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>AgTech Suite &bull; AI Model #4</span>
              <span className="bg-emerald-400/30 px-1.5 py-0.5 rounded text-[10px]">R² = 0.792</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Crop Yield & Production Forecasting
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Ensemble Random Forest regressor calibrated across 632 Indian agricultural districts and 115 crops. 
              Estimates expected per-hectare productivity, total harvest output in Tonnes & Quintals, and farm revenue.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-white">100</div>
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">RF Trees</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-emerald-400">79.2%</div>
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">R² Score</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-white">632</div>
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Districts</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-emerald-400">115</div>
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Crops</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Regional Presets Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest-700" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1-Click Regional Presets
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Load representative benchmark agricultural farming scenarios
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-forest-50 hover:border-forest-300 text-slate-700 hover:text-forest-900 text-xs font-medium whitespace-nowrap transition-all shadow-2xs flex items-center gap-1.5"
            >
              <span className="font-semibold">{p.title.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono">({p.district})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setMode('single')}
          className={`
            px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2
            ${mode === 'single'
              ? 'bg-forest-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
          `}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Single Plot Forecast</span>
        </button>

        <button
          onClick={() => {
            setMode('simulate');
            if (simulations.length === 0) handleSimulate();
          }}
          className={`
            px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2
            ${mode === 'simulate'
              ? 'bg-forest-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
          `}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Comparative Crop Simulator</span>
        </button>

        <button
          onClick={() => setMode('portfolio')}
          className={`
            px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2
            ${mode === 'portfolio'
              ? 'bg-forest-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
          `}
        >
          <Layers className="w-4 h-4" />
          <span>Multi-Field Portfolio Planner</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 1: SINGLE PLOT FORECAST */}
      {/* ==================================================================== */}
      {mode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Configuration Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersIcon className="w-4 h-4 text-forest-700" />
                <span>Agricultural Plot Parameters</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure regional geography, crop variety, and acreage.
              </p>
            </div>

            <form onSubmit={handlePredict} className="space-y-4">
              {/* State Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Union Territory
                </label>
                <div className="relative">
                  <select
                    value={stateName}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-forest-500 focus:bg-white"
                  >
                    {(categories?.states || Object.keys(STATE_DISTRICTS)).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District Selection with Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    District
                  </label>
                  <input
                    type="text"
                    placeholder={`Search ${currentDistricts.length} districts...`}
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="text-[11px] px-2 py-0.5 border border-slate-200 rounded bg-slate-50 w-36 focus:bg-white"
                  />
                </div>
                <select
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-forest-500 focus:bg-white"
                >
                  {filteredDistricts.length > 0 ? (
                    filteredDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {districtSearch ? `No districts matching "${districtSearch}"` : `No districts found for ${stateName}`}
                    </option>
                  )}
                </select>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Showing {filteredDistricts.length} of {currentDistricts.length} districts in {stateName}</span>
                </div>
              </div>

              {/* Crop Selection with Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    placeholder="Search 115 crops..."
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    className="text-[11px] px-2 py-0.5 border border-slate-200 rounded bg-slate-50 w-36 focus:bg-white"
                  />
                </div>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-forest-500 focus:bg-white font-mono"
                >
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value={crop}>{crop}</option>
                  )}
                </select>
              </div>

              {/* Season Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Agricultural Season
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(categories?.seasons || ['Autumn', 'Kharif', 'Rabi', 'Summer', 'Whole Year', 'Winter']).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeason(s)}
                      className={`
                        py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border
                        ${season === s
                          ? 'bg-forest-700 text-white border-forest-800 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area & Unit Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Cultivated Land Area
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setAreaUnit('hectares')}
                      className={`px-2 py-0.5 rounded ${areaUnit === 'hectares' ? 'bg-white text-forest-800 shadow-2xs' : 'text-slate-500'}`}
                    >
                      Hectares
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaUnit('acres')}
                      className={`px-2 py-0.5 rounded ${areaUnit === 'acres' ? 'bg-white text-forest-800 shadow-2xs' : 'text-slate-500'}`}
                    >
                      Acres
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={area}
                    onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-forest-500 focus:bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">
                    {areaUnit === 'hectares' ? `≈ ${(Number(area) * 2.47105).toFixed(1)} Acres` : `≈ ${(Number(area) / 2.47105).toFixed(1)} Ha`}
                  </span>
                </div>
              </div>

              {/* Crop Year & Market Price (Optional valuation) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harvest Year
                  </label>
                  <input
                    type="number"
                    min="1995"
                    max="2030"
                    value={cropYear}
                    onChange={(e) => setCropYear(parseInt(e.target.value) || 2024)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Market Price (₹/Tonne)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFetchPrice}
                      disabled={loadingAutoPrice}
                      title="Fetch AI-predicted market price for this crop & state"
                      className="text-[10px] text-forest-700 hover:text-forest-900 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {loadingAutoPrice ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      <span>AI Price</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
                    placeholder="e.g. 3200"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>≈ ₹{(Number(marketPrice) / 10).toFixed(0)} / Quintal</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab && setActiveTab('market_price')}
                      className="text-forest-600 hover:underline"
                    >
                      Market Price AI &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loadingPredict}
                className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                {loadingPredict ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Predicting Random Forest Yield...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Generate Yield Forecast</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display Panel */}
          <div className="lg:col-span-7 space-y-4">
            {prediction ? (
              <div className="space-y-4">
                {/* Hero Result Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                          {prediction.yield_category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {prediction.crop} &bull; {prediction.district}, {prediction.state}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                        Estimated Yield Rate
                      </h4>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-4xl font-extrabold text-forest-900 tracking-tight">
                          {prediction.predicted_yield_per_hectare.toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-slate-600">
                          Tonnes / Hectare
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Equivalent to {(prediction.predicted_yield_per_hectare / 2.47105 * 10).toFixed(2)} Quintals / Acre
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-forest-50 text-forest-700">
                      <Sprout className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Harvest Total & Economics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <div className="text-[11px] text-slate-500 font-medium">Total Production</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        {prediction.estimated_total_production_tonnes.toLocaleString()} <span className="text-xs font-normal text-slate-500">Tonnes</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {prediction.estimated_total_production_quintals.toLocaleString()} Quintals
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <div className="text-[11px] text-slate-500 font-medium">Gross Farm Valuation</div>
                      <div className="text-lg font-bold text-forest-700 mt-0.5">
                        ₹{(prediction.estimated_total_production_tonnes * marketPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        @ ₹{marketPrice.toLocaleString()}/Tonne
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                      <div className="text-[11px] text-slate-500 font-medium">Field Dimensions</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        {prediction.area_hectares} <span className="text-xs font-normal text-slate-500">Ha</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {prediction.area_acres} Acres
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agronomic Advisory Card */}
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-forest-700" />
                    <span>Agronomic Field Advisory & Best Practices</span>
                  </h4>
                  <ul className="space-y-2">
                    {prediction.agronomic_advisory?.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contributing Influence Factors */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Machine Learning Model Diagnostic Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {prediction.top_factors?.map((f, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[11px] font-bold text-slate-900">{f.factor}</div>
                        <div className="text-xs text-forest-700 font-semibold mt-0.5">{f.impact}</div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-snug">{f.description}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Inference Speed: <b className="text-slate-800">{prediction.inference_time_ms}ms</b></span>
                    <span>Confidence Benchmark: <b className="text-slate-800">{prediction.confidence_metric}</b></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-forest-700 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Ready to Forecast Crop Yield
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                  Select your state, district, crop type, and land area on the left to compute projected harvest yields, 
                  market valuation, and agronomic management guidelines.
                </p>
                <button
                  onClick={handlePredict}
                  className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Forecast Sample Yield (Kolhapur Sugarcane)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: COMPARATIVE CROP SIMULATOR */}
      {/* ==================================================================== */}
      {mode === 'simulate' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Land Parcel Crop Opportunity Simulation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulating yields across diverse crops for {areaInHa.toFixed(1)} Ha in {districtName}, {stateName}.
              </p>
            </div>
            <button
              onClick={handleSimulate}
              disabled={loadingSim}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              {loadingSim ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Re-run Simulation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations.map((sim, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:bg-white hover:border-forest-300 transition-all shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{sim.crop}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                    {sim.season}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-forest-800">
                    {sim.yield_per_hectare.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Tonnes / Ha</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Est. Total:</span>
                  <span className="font-bold text-slate-900">{sim.total_tonnes.toFixed(1)} Tonnes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 3: MULTI-FIELD PORTFOLIO PLANNER */}
      {/* ==================================================================== */}
      {mode === 'portfolio' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Plot Agricultural Farm Portfolio
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregate projected yields across multiple farm parcels or rotational blocks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addPortfolioPlot}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Parcel</span>
              </button>
              <button
                onClick={handleRunPortfolio}
                disabled={loadingBatch}
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {loadingBatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>Calculate Portfolio Yield</span>
              </button>
            </div>
          </div>

          {/* Plot List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Parcel / Block Name</th>
                  <th className="p-2.5">State</th>
                  <th className="p-2.5">District</th>
                  <th className="p-2.5">Season</th>
                  <th className="p-2.5">Crop</th>
                  <th className="p-2.5">Area (Ha)</th>
                  <th className="p-2.5 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolioPlots.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-medium text-slate-900">
                      <input
                        type="text"
                        value={p.plot_name}
                        onChange={(e) => updatePortfolioPlot(p.id, 'plot_name', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-36 font-semibold"
                      />
                    </td>
                    <td className="p-2.5">
                      <select
                        value={p.state}
                        onChange={(e) => {
                          const newState = e.target.value;
                          const dists = getDistrictsForState(newState);
                          const newDist = dists.includes(p.district) ? p.district : (dists[0] || '');
                          setPortfolioPlots(portfolioPlots.map(item =>
                            item.id === p.id ? { ...item, state: newState, district: newDist } : item
                          ));
                        }}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs max-w-[130px]"
                      >
                        {(categories?.states || Object.keys(STATE_DISTRICTS)).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={p.district}
                        onChange={(e) => updatePortfolioPlot(p.id, 'district', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs max-w-[130px]"
                      >
                        {getDistrictsForState(p.state).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={p.season}
                        onChange={(e) => updatePortfolioPlot(p.id, 'season', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                      >
                        {['Whole Year', 'Kharif', 'Rabi', 'Summer'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={p.crop}
                        onChange={(e) => updatePortfolioPlot(p.id, 'crop', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium"
                      >
                        {['Sugarcane', 'Rice', 'Wheat', 'Potato', 'Maize', 'Cotton(lint)', 'Coconut '].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={p.area}
                        onChange={(e) => updatePortfolioPlot(p.id, 'area', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-20 font-medium"
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => removePortfolioPlot(p.id)}
                        disabled={portfolioPlots.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Batch Portfolio Results */}
          {batchResult && (
            <div className="bg-forest-50/50 border border-forest-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
                Consolidated Portfolio Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-forest-100">
                  <div className="text-[11px] text-slate-500 font-medium">Total Cultivated Area</div>
                  <div className="text-lg font-bold text-slate-900">{batchResult.total_area_hectares} Ha</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-forest-100">
                  <div className="text-[11px] text-slate-500 font-medium">Gross Expected Harvest</div>
                  <div className="text-lg font-bold text-forest-700">{batchResult.total_estimated_production_tonnes} Tonnes</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-forest-100">
                  <div className="text-[11px] text-slate-500 font-medium">Weighted Avg Yield</div>
                  <div className="text-lg font-bold text-slate-900">{batchResult.average_yield_per_hectare} T/Ha</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-forest-100">
                  <div className="text-[11px] text-slate-500 font-medium">Top Performing Parcel</div>
                  <div className="text-xs font-bold text-emerald-800 truncate mt-1">{batchResult.highest_yielding_plot || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlidersIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="8" y2="8" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  );
}

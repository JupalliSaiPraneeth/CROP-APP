import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  RefreshCw, 
  ImageIcon, 
  FolderTree, 
  ExternalLink,
  ShieldAlert,
  Sprout
} from 'lucide-react';
import { api } from '../services/api';

export default function DatasetExplorer({ setActiveTab }) {
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');

  useEffect(() => {
    async function loadInfo() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDatasetInfo();
        setDatasetInfo(data);
      } catch (err) {
        setError(err.message || 'Failed to scan dataset directory');
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-forest-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Scanning local PlantVillage dataset directories...</p>
      </div>
    );
  }

  if (error || !datasetInfo) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center max-w-md mx-auto">
        <p className="text-xs font-semibold text-rose-800">{error || 'Dataset not found'}</p>
      </div>
    );
  }

  const crops = ['All', ...Object.keys(datasetInfo.crops_summary).sort()];

  const filteredClasses = datasetInfo.classes.filter((c) => {
    const matchesCrop = selectedCrop === 'All' || c.crop === selectedCrop;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.disease_status.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Dataset Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Dataset Subset</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            PlantVillage (Color Raw)
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">{datasetInfo.path}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Clean Photographs</span>
          <div className="text-2xl font-bold text-forest-800 mt-1 font-mono">
            {datasetInfo.total_images.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">256×256 RGB JPEG Images</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Supported Categories</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {datasetInfo.num_classes} Classes
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across 14 Unique Crops</p>
        </div>
      </div>

      {/* Dataset Partition Architecture Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <FolderTree className="w-4 h-4 text-forest-700" />
          <span>Machine Learning Partitioning Strategy</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          <b>Training Split (70%)</b> updates model convolutional kernel weights. 
          <b>Validation Split (15%)</b> tunes hyperparameters and early stopping (achieving the reported 95.54% validation accuracy). 
          <b>Testing Split (15%)</b> remains completely unseen to measure honest out-of-sample generalization.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crop or disease name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium mr-1">Crop:</span>
          {crops.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrop(c)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCrop === c
                  ? 'bg-forest-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {item.crop}
                </span>
                <span className="text-xs font-mono font-semibold text-forest-800">
                  {item.image_count} photos
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                {item.disease_status}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{item.name}</p>
            </div>

            {/* Thumbnail Preview strip */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
              {item.sample_images.map((imgName, i) => (
                <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={api.getSampleImageUrl(item.name, imgName)}
                    alt={`${item.name} sample`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              <div className="text-[10px] text-slate-400 ml-auto flex items-center gap-0.5">
                <span>Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

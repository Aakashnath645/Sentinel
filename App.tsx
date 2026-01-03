import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EarthquakeMap from './components/EarthquakeMap';
import AnalysisModal from './components/AnalysisModal';
import { fetchEarthquakes } from './services/usgs';
import { EarthquakeFeature, USGSGeoJSON } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Modal State
  const [modalQuake, setModalQuake] = useState<EarthquakeFeature | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Don't set loading true on refresh to keep UI smooth, only on initial load if needed
      if (earthquakes.length === 0) setLoading(true);
      
      const data: USGSGeoJSON = await fetchEarthquakes();
      // Ensure sorted by time descending (API usually does this, but to be safe)
      const sorted = data.features.sort((a, b) => b.properties.time - a.properties.time);
      setEarthquakes(sorted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to connect to seismic sensor network.");
    } finally {
      setLoading(false);
    }
  }, [earthquakes.length]);

  // Initial fetch and Poll
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 60s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelect = (id: string, feature: EarthquakeFeature) => {
    setSelectedId(id);
  };
  
  const handleAnalyze = (feature: EarthquakeFeature) => {
      setModalQuake(feature);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative">
      
      {/* Mobile Drawer / Desktop Sidebar */}
      <div className="hidden md:block h-full z-20">
        <Sidebar 
            earthquakes={earthquakes} 
            onSelect={handleSelect} 
            selectedId={selectedId}
            lastUpdated={lastUpdated}
        />
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative h-full">
         {/* Loading Overlay */}
         {loading && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                 <div className="flex flex-col items-center gap-4">
                     <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                     <span className="text-teal-400 font-mono tracking-widest animate-pulse">INITIALIZING SENSORS...</span>
                 </div>
             </div>
         )}
         
         {/* Error Toast */}
         {error && (
             <div className="absolute top-4 right-4 z-50 bg-red-900/90 text-red-100 p-4 rounded border border-red-500 flex items-center gap-3 shadow-xl">
                 <AlertCircle className="w-6 h-6" />
                 <div>
                     <h4 className="font-bold">Connection Error</h4>
                     <p className="text-sm">{error}</p>
                 </div>
             </div>
         )}

         <EarthquakeMap 
            earthquakes={earthquakes} 
            selectedId={selectedId}
            onSelect={handleSelect}
            onAnalyze={handleAnalyze}
         />

         {/* Mobile Bottom Sheet (Simplified) */}
         <div className="md:hidden absolute bottom-0 left-0 right-0 h-1/3 bg-slate-900 z-20 border-t border-slate-700">
             <Sidebar 
                earthquakes={earthquakes} 
                onSelect={handleSelect} 
                selectedId={selectedId}
                lastUpdated={lastUpdated}
            />
         </div>
      </div>
      
      {/* Analysis Modal */}
      {modalQuake && (
          <AnalysisModal 
            quake={modalQuake} 
            onClose={() => setModalQuake(null)} 
          />
      )}
    </div>
  );
};

export default App;
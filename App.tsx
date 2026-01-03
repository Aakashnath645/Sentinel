import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import EarthquakeMap from './components/EarthquakeMap';
import AnalysisModal from './components/AnalysisModal';
import { fetchEarthquakes } from './services/usgs';
import { EarthquakeFeature, USGSGeoJSON } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

// --- Sound Utility ---
// Generates a "Sci-Fi Sonar Ping" using Web Audio API to avoid external assets
const playSonarPing = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Sonar Tone: High pitched Sine wave with a distinct ping envelope
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        
        // Envelope: Sharp attack, long smooth decay
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // Decay

        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Audio Alert State Refs
  const previousIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalQuake, setModalQuake] = useState<EarthquakeFeature | null>(null);

  // Define loadData with NO dependencies on 'earthquakes' state to prevent infinite loops
  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      const data: USGSGeoJSON = await fetchEarthquakes();
      
      // Check for new major earthquakes (Mag >= 5.0) for audio alert
      // We only run this check if it is NOT the initial load
      if (!isInitialLoadRef.current) {
          const newMajorQuakes = data.features.filter(f => {
              const isMajor = f.properties.mag >= 5.0;
              const isNew = !previousIdsRef.current.has(f.id);
              return isMajor && isNew;
          });

          if (newMajorQuakes.length > 0) {
              playSonarPing();
          }
      }

      // Update refs
      const currentIds = new Set(data.features.map(f => f.id));
      previousIdsRef.current = currentIds;
      isInitialLoadRef.current = false;

      // Ensure sorted by time descending
      const sorted = data.features.sort((a, b) => b.properties.time - a.properties.time);
      
      setEarthquakes(sorted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Data load failed:", err);
      setError("Failed to connect to seismic sensor network.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial fetch and Poll
  useEffect(() => {
    // Initial load (shows spinner)
    loadData(false);
    
    // Background polling every 60s (no spinner)
    const interval = setInterval(() => {
        loadData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter Logic
  const filteredEarthquakes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return earthquakes;

    // Check for magnitude filter pattern (e.g. ">5", "m5", "5+")
    const magMatch = query.match(/^(?:>|>=|m)\s*(\d+(?:\.\d+)?)\+?$/);
    
    if (magMatch) {
      const minMag = parseFloat(magMatch[1]);
      return earthquakes.filter(q => q.properties.mag >= minMag);
    }

    // Default: Filter by location name
    return earthquakes.filter(q => q.properties.place.toLowerCase().includes(query));
  }, [earthquakes, searchQuery]);

  const handleSelect = (id: string, feature: EarthquakeFeature) => {
    setSelectedId(id);
  };
  
  const handleAnalyze = (feature: EarthquakeFeature) => {
      setModalQuake(feature);
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-zinc-950 overflow-hidden relative">
      
      {/* Mobile Drawer / Desktop Sidebar */}
      <div className="hidden md:block h-full z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <Sidebar 
            earthquakes={filteredEarthquakes} 
            onSelect={handleSelect} 
            selectedId={selectedId}
            lastUpdated={lastUpdated}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
        />
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative h-full flex flex-col min-h-0">
         {/* Top decorative border */}
         <div className="h-1 bg-gradient-to-r from-cyan-900/0 via-cyan-500/50 to-cyan-900/0 w-full z-10 flex-none" />

         <div className="relative flex-1 bg-slate-950/50 min-h-0">
             {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                        <span className="text-cyan-400 font-mono tracking-[0.5em] animate-pulse text-sm">INITIALIZING SENSORS...</span>
                    </div>
                </div>
            )}
            
            {/* Error Toast */}
            {error && (
                <div className="absolute top-4 right-4 z-50 bg-red-950/90 text-red-100 p-4 border border-red-500/50 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                        <h4 className="font-bold font-mono uppercase">System Error</h4>
                        <p className="text-xs font-mono">{error}</p>
                    </div>
                </div>
            )}

            <EarthquakeMap 
                earthquakes={filteredEarthquakes} 
                selectedId={selectedId}
                onSelect={handleSelect}
                onAnalyze={handleAnalyze}
            />
         </div>

         {/* Mobile Bottom Sheet (Simplified) */}
         <div className="md:hidden absolute bottom-0 left-0 right-0 h-1/3 bg-slate-900 z-20 border-t border-cyan-500/30">
             <Sidebar 
                earthquakes={filteredEarthquakes} 
                onSelect={handleSelect} 
                selectedId={selectedId}
                lastUpdated={lastUpdated}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
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
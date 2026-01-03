import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import EarthquakeMap from './components/EarthquakeMap';
import AnalysisModal from './components/AnalysisModal';
import MuseumSlider from './components/MuseumSlider';
import { fetchEarthquakes } from './services/usgs';
import { LEGENDS } from './data/legends';
import { EarthquakeFeature, USGSGeoJSON } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

// --- Sound Utility ---
const playSonarPing = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

interface WaveSimState {
    station: { lat: number; lng: number } | null;
    epicenter: { lat: number; lng: number } | null;
    isRunning: boolean;
    elapsedTime: number; // Simulation seconds
    pRadius: number; // km
    sRadius: number; // km
}

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
  
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Modal State
  const [modalQuake, setModalQuake] = useState<EarthquakeFeature | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<'live' | 'museum' | 'lab' | 'protocols'>('live');
  const [currentLegendIndex, setCurrentLegendIndex] = useState(0);

  // Lab State
  const [labTab, setLabTab] = useState<'impact' | 'wave'>('impact');
  const [labState, setLabState] = useState({ mag: 5.0, depth: 10 });
  const [waveSim, setWaveSim] = useState<WaveSimState>({
      station: null,
      epicenter: null,
      isRunning: false,
      elapsedTime: 0,
      pRadius: 0,
      sRadius: 0
  });

  const activeLegend = useMemo(() => LEGENDS[currentLegendIndex], [currentLegendIndex]);

  // Define loadData with NO dependencies on 'earthquakes' state to prevent infinite loops
  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      const data: USGSGeoJSON = await fetchEarthquakes();
      
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

      const currentIds = new Set(data.features.map(f => f.id));
      previousIdsRef.current = currentIds;
      isInitialLoadRef.current = false;

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

  // Initial fetch, Poll, and Geolocation
  useEffect(() => {
    loadData(false);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.warn("Geolocation permission denied or failed", error);
            }
        );
    }

    const interval = setInterval(() => {
        loadData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  // --- WAVE SIMULATION LOOP ---
  useEffect(() => {
      let animationFrame: number;
      let lastTime = performance.now();
      const SPEED_MULTIPLIER = 10; // 1 real sec = 10 sim sec
      const P_SPEED = 6; // km/s
      const S_SPEED = 3.5; // km/s

      const animate = (time: number) => {
          if (!waveSim.isRunning) return;

          const deltaSeconds = (time - lastTime) / 1000;
          lastTime = time;

          setWaveSim(prev => {
              if (!prev.isRunning) return prev;
              const newElapsed = prev.elapsedTime + (deltaSeconds * SPEED_MULTIPLIER);
              
              // Max radius safety break (e.g., 20,000 km)
              if (newElapsed * S_SPEED > 20000) {
                  return { ...prev, isRunning: false };
              }

              return {
                  ...prev,
                  elapsedTime: newElapsed,
                  pRadius: newElapsed * P_SPEED,
                  sRadius: newElapsed * S_SPEED
              };
          });

          animationFrame = requestAnimationFrame(animate);
      };

      if (waveSim.isRunning) {
          lastTime = performance.now();
          animationFrame = requestAnimationFrame(animate);
      }

      return () => cancelAnimationFrame(animationFrame);
  }, [waveSim.isRunning]);


  const filteredEarthquakes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return earthquakes;

    const magMatch = query.match(/^(?:>|>=|m)\s*(\d+(?:\.\d+)?)\+?$/);
    
    if (magMatch) {
      const minMag = parseFloat(magMatch[1]);
      return earthquakes.filter(q => q.properties.mag >= minMag);
    }

    return earthquakes.filter(q => q.properties.place.toLowerCase().includes(query));
  }, [earthquakes, searchQuery]);

  const handleSelect = (id: string, feature: EarthquakeFeature) => {
    setSelectedId(id);
  };
  
  const handleAnalyze = (feature: EarthquakeFeature) => {
      setModalQuake(feature);
  };
  
  // Handle Map Clicks for Lab Mode
  const handleMapClick = (latlng: {lat: number, lng: number}) => {
      if (viewMode !== 'lab' || labTab !== 'wave') return;

      if (!waveSim.station) {
          setWaveSim(prev => ({ ...prev, station: latlng }));
      } else if (!waveSim.epicenter) {
          setWaveSim(prev => ({ ...prev, epicenter: latlng }));
      }
  };

  const handleLabReset = () => {
      setWaveSim({
          station: null,
          epicenter: null,
          isRunning: false,
          elapsedTime: 0,
          pRadius: 0,
          sRadius: 0
      });
  };
  
  const handleLabStart = () => {
      if (waveSim.station && waveSim.epicenter) {
          setWaveSim(prev => ({ ...prev, isRunning: true, elapsedTime: 0, pRadius: 0, sRadius: 0 }));
      }
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-zinc-950 overflow-hidden relative">
      
      {/* Mobile Drawer / Desktop Sidebar */}
      <div className="hidden md:block h-full z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <Sidebar 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            earthquakes={filteredEarthquakes} 
            onSelect={handleSelect} 
            selectedId={selectedId}
            lastUpdated={lastUpdated}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            userLocation={userLocation}
            activeLegend={activeLegend}
            labState={labState}
            onLabStateChange={setLabState}
            labTab={labTab}
            onLabTabChange={setLabTab}
            waveSim={waveSim}
            onWaveReset={handleLabReset}
            onWaveStart={handleLabStart}
        />
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative h-full flex flex-col min-h-0">
         {/* Top decorative border */}
         <div className={`h-1 w-full z-10 flex-none transition-colors duration-500 ${
             viewMode === 'live' ? 'bg-gradient-to-r from-cyan-900/0 via-cyan-500/50 to-cyan-900/0' 
             : viewMode === 'museum' ? 'bg-gradient-to-r from-red-900/0 via-red-500/50 to-red-900/0'
             : viewMode === 'lab' ? 'bg-gradient-to-r from-purple-900/0 via-purple-500/50 to-purple-900/0'
             : 'bg-gradient-to-r from-green-900/0 via-green-500/50 to-green-900/0'
         }`} />

         <div className="relative flex-1 bg-slate-950/50 min-h-0">
             {/* Loading Overlay */}
            {loading && viewMode === 'live' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                        <span className="text-cyan-400 font-mono tracking-[0.5em] animate-pulse text-sm">INITIALIZING SENSORS...</span>
                    </div>
                </div>
            )}
            
            {/* Error Toast */}
            {error && viewMode === 'live' && (
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
                viewMode={viewMode}
                activeLegend={activeLegend}
                labState={labState}
                labTab={labTab}
                waveSim={waveSim}
                onMapClick={handleMapClick}
            />

            {/* Museum Controls */}
            {viewMode === 'museum' && (
                <MuseumSlider 
                    currentIndex={currentLegendIndex} 
                    onChange={setCurrentLegendIndex} 
                />
            )}
         </div>

         {/* Mobile Bottom Sheet (Simplified) */}
         <div className="md:hidden absolute bottom-0 left-0 right-0 h-1/3 bg-slate-900 z-20 border-t border-cyan-500/30">
             <Sidebar 
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                earthquakes={filteredEarthquakes} 
                onSelect={handleSelect} 
                selectedId={selectedId}
                lastUpdated={lastUpdated}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                userLocation={userLocation}
                activeLegend={activeLegend}
                labState={labState}
                onLabStateChange={setLabState}
                labTab={labTab}
                onLabTabChange={setLabTab}
                waveSim={waveSim}
                onWaveReset={handleLabReset}
                onWaveStart={handleLabStart}
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
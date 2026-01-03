import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import EarthquakeMap from './components/EarthquakeMap';
import AnalysisModal from './components/AnalysisModal';
import MuseumSlider from './components/MuseumSlider';
import SplashScreen from './components/SplashScreen';
import { fetchEarthquakes } from './services/usgs';
import { LEGENDS } from './data/legends';
import { EarthquakeFeature, USGSGeoJSON } from './types';
import { Loader2, AlertCircle, Scan, Map as MapIcon, Globe } from 'lucide-react';

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

interface LabState {
    mag: number;
    depth: number;
    location: { lat: number; lng: number } | null;
}

const IDLE_TIMEOUT = 60000; // 60 seconds
const PATROL_INTERVAL = 10000; // 10 seconds

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
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
  const [labTab, setLabTab] = useState<'impact' | 'wave' | 'forecast'>('impact');
  const [labState, setLabState] = useState<LabState>({ mag: 5.0, depth: 10, location: null });
  const [waveSim, setWaveSim] = useState<WaveSimState>({
      station: null,
      epicenter: null,
      isRunning: false,
      elapsedTime: 0,
      pRadius: 0,
      sRadius: 0
  });

  // --- SCREENSAVER / PATROL MODE STATE ---
  const [isIdle, setIsIdle] = useState(false);
  const [patrolIndex, setPatrolIndex] = useState(0);
  const idleTimeoutRef = useRef<number | null>(null);

  const activeLegend = useMemo(() => LEGENDS[currentLegendIndex], [currentLegendIndex]);

  // Derive Patrol Targets (Top 20 largest events)
  const patrolTargets = useMemo(() => {
      return [...earthquakes]
          .sort((a, b) => b.properties.mag - a.properties.mag)
          .slice(0, 20);
  }, [earthquakes]);

  const currentPatrolTarget = isIdle && patrolTargets.length > 0 ? patrolTargets[patrolIndex] : null;

  // --- IDLE DETECTION ---
  const resetIdleTimer = useCallback(() => {
      // Don't start idle timer until splash is gone
      if (showSplash) return;

      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = window.setTimeout(() => {
          setIsIdle(true);
          setPatrolIndex(0); // Start patrol from top
      }, IDLE_TIMEOUT);
  }, [showSplash]);

  useEffect(() => {
      if (showSplash) return; // Disable idle detection logic during splash

      const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      
      // Start timer on mount (or when splash finishes)
      resetIdleTimer();

      return () => {
          events.forEach(event => window.removeEventListener(event, resetIdleTimer));
          if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      };
  }, [resetIdleTimer, showSplash]);

  // --- PATROL LOOP ---
  useEffect(() => {
      if (!isIdle || patrolTargets.length === 0) return;

      const interval = setInterval(() => {
          setPatrolIndex(prev => (prev + 1) % patrolTargets.length);
      }, PATROL_INTERVAL);

      return () => clearInterval(interval);
  }, [isIdle, patrolTargets]);


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
      if (viewMode !== 'lab') return;

      if (labTab === 'impact') {
           setLabState(prev => ({ ...prev, location: latlng }));
      } else if (labTab === 'wave') {
          if (!waveSim.station) {
              setWaveSim(prev => ({ ...prev, station: latlng }));
          } else if (!waveSim.epicenter) {
              setWaveSim(prev => ({ ...prev, epicenter: latlng }));
          }
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
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div className={`flex h-[100dvh] w-screen bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-zinc-950 overflow-hidden relative transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Mobile Drawer / Desktop Sidebar - Collapses width when idle to let map fill space */}
        <div className={`hidden md:block h-full z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out flex-shrink-0 overflow-hidden ${isIdle ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[500px] opacity-100'}`}>
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
          {/* Top decorative border - Fades out when idle */}
          <div className={`h-1 w-full z-10 flex-none transition-all duration-1000 ${
              isIdle ? 'opacity-0' : 'opacity-100'
          } ${
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
              {error && viewMode === 'live' && !isIdle && (
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
                  isIdle={isIdle}
                  patrolTarget={currentPatrolTarget}
              />

              {/* Museum Controls - Fades when idle */}
              <div className={`transition-opacity duration-1000 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  {viewMode === 'museum' && (
                      <MuseumSlider 
                          currentIndex={currentLegendIndex} 
                          onChange={setCurrentLegendIndex} 
                      />
                  )}
              </div>

              {/* --- CINEMATIC PATROL OVERLAY (Visible only when Idle) --- */}
              <div className={`absolute inset-x-0 bottom-24 flex justify-center pointer-events-none transition-all duration-1000 z-[1000] ${isIdle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  {currentPatrolTarget && (
                      <div className="text-center space-y-2">
                          <div className="inline-block bg-slate-950/60 backdrop-blur-md border-y border-cyan-500/30 py-4 px-12 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-scanline opacity-50"></div>
                              
                              <div className="flex items-center justify-center gap-2 text-cyan-500 text-[10px] font-mono tracking-[0.4em] uppercase mb-2">
                                  <Scan className="w-3 h-3 animate-pulse" />
                                  <span>Satellite Patrol Mode</span>
                              </div>

                              <h2 className="text-3xl md:text-5xl font-bold text-white font-mono uppercase tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] leading-none mb-3">
                                  {currentPatrolTarget.properties.place.split(' of ').pop() || currentPatrolTarget.properties.place}
                              </h2>

                              <div className="flex justify-center gap-8 text-slate-300 font-mono text-xs md:text-sm tracking-wider">
                                  <div className="flex items-center gap-2">
                                      <span className="text-slate-500">MAG</span>
                                      <span className="text-cyan-400 font-bold text-lg">{currentPatrolTarget.properties.mag.toFixed(1)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="text-slate-500">DEPTH</span>
                                      <span className="text-white font-bold">{currentPatrolTarget.geometry.coordinates[2]} KM</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-400">{currentPatrolTarget.geometry.coordinates[1].toFixed(2)}, {currentPatrolTarget.geometry.coordinates[0].toFixed(2)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

          </div>

          {/* Mobile Bottom Sheet - Fades when idle */}
          <div className={`md:hidden absolute bottom-0 left-0 right-0 h-1/3 bg-slate-900 z-20 border-t border-cyan-500/30 transition-all duration-1000 ${isIdle ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
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
        
        {/* Analysis Modal - Only if not idle */}
        {modalQuake && !isIdle && (
            <AnalysisModal 
              quake={modalQuake} 
              onClose={() => setModalQuake(null)} 
            />
        )}
      </div>
    </>
  );
};

export default App;
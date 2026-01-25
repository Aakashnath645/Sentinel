import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import EarthquakeMap from './components/EarthquakeMap';
import AnalysisModal from './components/AnalysisModal';
import MuseumSlider from './components/MuseumSlider';
import SplashScreen from './components/SplashScreen';
import { fetchEarthquakes, fetchVolcanoes } from './services/usgs';
import { fetchSpaceWeather } from './services/noaa';
import { fetchISSPosition } from './services/iss';
import { LEGENDS } from './data/legends';
import { EarthquakeFeature, USGSGeoJSON, VolcanoFeature, SpaceWeather, ISSPosition } from './types';
import { Loader2, AlertCircle, Scan, Globe } from 'lucide-react';

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
    elapsedTime: number; 
    pRadius: number; 
    sRadius: number; 
}

interface LabState {
    mag: number;
    depth: number;
    location: { lat: number; lng: number } | null;
}

const IDLE_TIMEOUT = 60000; 
const PATROL_INTERVAL = 10000; 

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [volcanoes, setVolcanoes] = useState<VolcanoFeature[]>([]);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | null>(null);
  const [issPosition, setIssPosition] = useState<ISSPosition | null>(null);
  const [issPath, setIssPath] = useState<[number, number][]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const previousIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const [modalQuake, setModalQuake] = useState<EarthquakeFeature | null>(null);

  const [viewMode, setViewMode] = useState<'live' | 'museum' | 'lab' | 'protocols' | 'magma' | 'cosmic'>('live');
  const [currentLegendIndex, setCurrentLegendIndex] = useState(0);

  const [labTab, setLabTab] = useState<'impact' | 'wave' | 'forecast'>('impact');
  const [labState, setLabState] = useState<LabState>({ mag: 5.0, depth: 10, location: null });
  const [waveSim, setWaveSim] = useState<WaveSimState>({ station: null, epicenter: null, isRunning: false, elapsedTime: 0, pRadius: 0, sRadius: 0 });

  const [isIdle, setIsIdle] = useState(false);
  const [patrolIndex, setPatrolIndex] = useState(0);
  const idleTimeoutRef = useRef<number | null>(null);

  const activeLegend = useMemo(() => LEGENDS[currentLegendIndex], [currentLegendIndex]);

  const patrolTargets = useMemo(() => {
      return [...earthquakes].sort((a, b) => b.properties.mag - a.properties.mag).slice(0, 20);
  }, [earthquakes]);

  const currentPatrolTarget = isIdle && patrolTargets.length > 0 ? patrolTargets[patrolIndex] : null;

  const resetIdleTimer = useCallback(() => {
      if (showSplash) return;
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = window.setTimeout(() => {
          setIsIdle(true);
          setPatrolIndex(0);
      }, IDLE_TIMEOUT);
  }, [showSplash]);

  useEffect(() => {
      if (showSplash) return; 
      const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();
      return () => {
          events.forEach(event => window.removeEventListener(event, resetIdleTimer));
          if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      };
  }, [resetIdleTimer, showSplash]);

  useEffect(() => {
      if (!isIdle || patrolTargets.length === 0) return;
      const interval = setInterval(() => {
          setPatrolIndex(prev => (prev + 1) % patrolTargets.length);
      }, PATROL_INTERVAL);
      return () => clearInterval(interval);
  }, [isIdle, patrolTargets]);


  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data: USGSGeoJSON = await fetchEarthquakes();
      
      const nextIds = new Set<string>();
      let hasNewMajorQuake = false;

      for (const f of data.features) {
          nextIds.add(f.id);
          if (!isInitialLoadRef.current && !hasNewMajorQuake) {
              if (f.properties.mag >= 5.0 && !previousIdsRef.current.has(f.id)) {
                  hasNewMajorQuake = true;
              }
          }
      }

      if (hasNewMajorQuake) {
          playSonarPing();
      }

      previousIdsRef.current = nextIds;
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

  useEffect(() => {
      fetchVolcanoes().then(setVolcanoes);
      fetchSpaceWeather().then(setSpaceWeather);
      const pollISS = async () => {
          const pos = await fetchISSPosition();
          if (pos) {
              setIssPosition(pos);
              setIssPath(prev => {
                  const newPath = [...prev, [pos.latitude, pos.longitude] as [number, number]];
                  return newPath.slice(-30);
              });
          }
      };
      pollISS();
      const issInterval = setInterval(pollISS, 2000);
      return () => clearInterval(issInterval);
  }, []);

  useEffect(() => {
    loadData(false);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (error) => console.warn("Geolocation denied", error)
        );
    }
    const interval = setInterval(() => { loadData(true); fetchSpaceWeather().then(setSpaceWeather); }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
      let animationFrame: number;
      let lastTime = performance.now();
      const SPEED_MULTIPLIER = 10; 
      const P_SPEED = 6; 
      const S_SPEED = 3.5; 

      const animate = (time: number) => {
          if (!waveSim.isRunning) return;
          const deltaSeconds = (time - lastTime) / 1000;
          lastTime = time;
          setWaveSim(prev => {
              if (!prev.isRunning) return prev;
              const newElapsed = prev.elapsedTime + (deltaSeconds * SPEED_MULTIPLIER);
              if (newElapsed * S_SPEED > 20000) return { ...prev, isRunning: false };
              return { ...prev, elapsedTime: newElapsed, pRadius: newElapsed * P_SPEED, sRadius: newElapsed * S_SPEED };
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

  const handleSelect = useCallback((id: string, feature: EarthquakeFeature) => {
    setSelectedId(id);
  }, []);
  
  const handleAnalyze = useCallback((feature: EarthquakeFeature) => {
      setModalQuake(feature);
  }, []);
  
  const handleMapClick = useCallback((latlng: {lat: number, lng: number}) => {
      if (viewMode !== 'lab') return;
      if (labTab === 'impact') setLabState(prev => ({ ...prev, location: latlng }));
      else if (labTab === 'wave') {
          setWaveSim(prev => !prev.station ? { ...prev, station: latlng } : !prev.epicenter ? { ...prev, epicenter: latlng } : prev);
      }
  }, [viewMode, labTab]);

  const handleLabReset = () => setWaveSim({ station: null, epicenter: null, isRunning: false, elapsedTime: 0, pRadius: 0, sRadius: 0 });
  
  const handleLabStart = () => {
      if (waveSim.station && waveSim.epicenter) setWaveSim(prev => ({ ...prev, isRunning: true, elapsedTime: 0, pRadius: 0, sRadius: 0 }));
  };

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      
      {/* 
          LAYOUT STRATEGY:
          - Mobile: Vertical Stack (Map Top 55%, Sidebar Bottom 45%)
          - Desktop: Horizontal Row (Sidebar Left, Map Right)
      */}
      <div className={`flex flex-col md:flex-row h-[100dvh] w-screen bg-slate-950 overflow-hidden relative transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* --- SIDEBAR CONTAINER --- */}
        <div className={`
             flex-none z-30 transition-all duration-300 ease-out bg-slate-950 border-t md:border-t-0 md:border-r border-slate-800
             order-2 md:order-1
             h-[45%] md:h-full
             w-full md:w-auto
             ${isIdle ? 'md:max-w-0 md:opacity-0 md:overflow-hidden' : 'md:max-w-[450px] opacity-100'}
        `}>
          <Sidebar 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              earthquakes={filteredEarthquakes} 
              volcanoes={volcanoes}
              spaceWeather={spaceWeather}
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

        {/* --- MAP CONTAINER --- */}
        <div className="order-1 md:order-2 flex-1 relative flex flex-col min-h-0 min-w-0 h-[55%] md:h-full">
          {/* Decorative Gradient Line */}
          <div className={`h-1 w-full z-10 flex-none transition-all duration-1000 ${isIdle ? 'opacity-0' : 'opacity-100'} ${
              viewMode === 'live' ? 'bg-gradient-to-r from-cyan-900/0 via-cyan-500/50 to-cyan-900/0' 
              : viewMode === 'museum' ? 'bg-gradient-to-r from-red-900/0 via-red-500/50 to-red-900/0'
              : viewMode === 'lab' ? 'bg-gradient-to-r from-purple-900/0 via-purple-500/50 to-purple-900/0'
              : viewMode === 'magma' ? 'bg-gradient-to-r from-orange-900/0 via-orange-500/50 to-orange-900/0'
              : viewMode === 'cosmic' ? 'bg-gradient-to-r from-blue-900/0 via-blue-500/50 to-blue-900/0'
              : 'bg-gradient-to-r from-green-900/0 via-green-500/50 to-green-900/0'
          }`} />

          <div className="relative flex-1 bg-slate-950/50 min-h-0">
              {loading && viewMode === 'live' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm pointer-events-none">
                      <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                          <span className="text-cyan-400 font-mono tracking-[0.5em] animate-pulse text-sm">INITIALIZING SENSORS...</span>
                      </div>
                  </div>
              )}
              
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
                  volcanoes={volcanoes}
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
                  issPosition={issPosition}
                  issPath={issPath}
              />

              <div className={`transition-opacity duration-1000 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  {viewMode === 'museum' && <MuseumSlider currentIndex={currentLegendIndex} onChange={setCurrentLegendIndex} />}
              </div>

              {/* Screensaver Overlay */}
              <div className={`absolute inset-x-0 bottom-8 md:bottom-24 flex justify-center pointer-events-none transition-all duration-1000 z-[1000] ${isIdle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  {currentPatrolTarget && (
                      <div className="text-center space-y-2 px-4 w-full">
                          <div className="inline-block bg-slate-950/60 backdrop-blur-md border-y border-cyan-500/30 py-4 px-12 relative overflow-hidden group max-w-full">
                              <div className="absolute inset-0 bg-scanline opacity-50"></div>
                              <div className="flex items-center justify-center gap-2 text-cyan-500 text-[10px] font-mono tracking-[0.4em] uppercase mb-2">
                                  <Scan className="w-3 h-3 animate-pulse" />
                                  <span>Satellite Patrol Mode</span>
                              </div>
                              <h2 className="text-2xl md:text-5xl font-bold text-white font-mono uppercase tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] leading-none mb-3 truncate">
                                  {currentPatrolTarget.properties.place.split(' of ').pop() || currentPatrolTarget.properties.place}
                              </h2>
                              <div className="flex justify-center flex-wrap gap-4 md:gap-8 text-slate-300 font-mono text-xs md:text-sm tracking-wider">
                                  <div className="flex items-center gap-2"><span className="text-slate-500">MAG</span><span className="text-cyan-400 font-bold text-lg">{(currentPatrolTarget.properties.mag || 0).toFixed(1)}</span></div>
                                  <div className="flex items-center gap-2"><span className="text-slate-500">DEPTH</span><span className="text-white font-bold">{currentPatrolTarget.geometry.coordinates[2]} KM</span></div>
                                  <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-slate-500" /><span className="text-slate-400">{(currentPatrolTarget.geometry.coordinates[1] || 0).toFixed(2)}, {(currentPatrolTarget.geometry.coordinates[0] || 0).toFixed(2)}</span></div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>
        
        {modalQuake && !isIdle && <AnalysisModal quake={modalQuake} onClose={() => setModalQuake(null)} />}
      </div>
    </>
  );
};

export default App;
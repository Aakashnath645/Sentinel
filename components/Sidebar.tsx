import React, { useMemo, useState } from 'react';
import { EarthquakeFeature, LegendEvent } from '../types';
import { Activity, Radio, Clock, MapPin, Search, Database, BarChart3, Wifi, Waves, Navigation, AlertTriangle, PanelLeftClose, PanelLeftOpen, Landmark, Skull, Beaker, Zap, Layers, Play, RotateCcw, Target, MousePointer2 } from 'lucide-react';

interface SidebarProps {
  viewMode: 'live' | 'museum' | 'lab';
  onViewModeChange: (mode: 'live' | 'museum' | 'lab') => void;
  earthquakes: EarthquakeFeature[];
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  selectedId: string | null;
  lastUpdated: Date;
  searchQuery: string;
  onSearch: (query: string) => void;
  userLocation: { lat: number; lng: number } | null;
  activeLegend: LegendEvent | null;
  labState: { mag: number; depth: number };
  onLabStateChange: (state: { mag: number; depth: number }) => void;
  labTab: 'impact' | 'wave';
  onLabTabChange: (tab: 'impact' | 'wave') => void;
  waveSim: {
      station: { lat: number; lng: number } | null;
      epicenter: { lat: number; lng: number } | null;
      isRunning: boolean;
      elapsedTime: number;
  };
  onWaveReset: () => void;
  onWaveStart: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    viewMode,
    onViewModeChange,
    earthquakes, 
    onSelect, 
    selectedId, 
    lastUpdated, 
    searchQuery, 
    onSearch,
    userLocation,
    activeLegend,
    labState,
    onLabStateChange,
    labTab,
    onLabTabChange,
    waveSim,
    onWaveReset,
    onWaveStart
}) => {
  const [sortBy, setSortBy] = useState<'time' | 'distance'>('time');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Stats Calculation
  const totalEvents = earthquakes.length;
  const maxMag = earthquakes.reduce((max, q) => (q.properties.mag > max ? q.properties.mag : max), 0);
  
  // Format helper
  const formatTimeAgo = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 60000; // minutes
    if (diff < 60) return `${Math.floor(diff)} MIN`;
    const hours = diff / 60;
    return `${Math.floor(hours)} HRS`;
  };

  const getMagColor = (mag: number) => {
    if (mag < 2.0) return 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    if (mag < 4.5) return 'text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
    if (mag < 6.0) return 'text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
    return 'text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'; 
  };

  // Lab Helpers
  const getTNTEquivalent = (mag: number) => {
      if (mag < 2) return "Construction Site Blast";
      if (mag < 3) return "Large Quarry Blast";
      if (mag < 4) return "Small Atomic Bomb (0.1 kt)";
      if (mag < 5) return "Average Tornado Energy";
      if (mag < 6) return "Hiroshima Bomb (15 kt)";
      if (mag < 7) return "Largest Thermonuclear Test (50 Mt)";
      if (mag < 8) return "San Francisco 1906 Earthquake";
      if (mag < 9) return "Krakatoa Eruption (200 Mt)";
      if (mag < 10) return "World's Total Nuclear Arsenal";
      return "Asteroid Impact (Extinction Level)";
  };

  const getEnergyJoules = (mag: number) => {
      const exp = 5.24 + 1.44 * mag;
      return `10^${exp.toFixed(1)} J`;
  };

  // Wave Helpers
  const calculateWaveStats = () => {
      if (!waveSim.station || !waveSim.epicenter) return null;
      
      const R = 6371; 
      const dLat = (waveSim.epicenter.lat - waveSim.station.lat) * (Math.PI / 180);
      const dLon = (waveSim.epicenter.lng - waveSim.station.lng) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(waveSim.station.lat * (Math.PI / 180)) * Math.cos(waveSim.epicenter.lat * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
      const dist = R * c; // km

      // Speeds: P = 6km/s, S = 3.5km/s
      const pTime = dist / 6;
      const sTime = dist / 3.5;

      return { dist, pTime, sTime };
  };

  const waveStats = calculateWaveStats();

  // Haversine Distance Formula (km) used for Live Feed
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  const sortedEarthquakes = useMemo(() => {
    const withDistance = earthquakes.map(q => {
        let dist = null;
        if (userLocation) {
            dist = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                q.geometry.coordinates[1], 
                q.geometry.coordinates[0]
            );
        }
        return { ...q, distanceToUser: dist };
    });

    if (sortBy === 'distance' && userLocation) {
        return withDistance.sort((a, b) => {
            if (a.distanceToUser === null) return 1;
            if (b.distanceToUser === null) return -1;
            return a.distanceToUser - b.distanceToUser;
        });
    } else {
        return withDistance.sort((a, b) => b.properties.time - a.properties.time);
    }
  }, [earthquakes, userLocation, sortBy]);

  return (
    <div 
        className={`flex flex-col h-full bg-slate-950 border-r border-slate-800/80 relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden w-full ${
            isCollapsed ? 'md:w-[60px]' : 'md:w-[450px]'
        }`}
    >
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-3 z-50 p-1.5 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-900/30 rounded-sm transition-colors hidden md:flex items-center justify-center border border-transparent hover:border-cyan-500/30"
        title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div 
        className={`flex-1 flex flex-col h-full w-full md:w-[450px] transition-opacity duration-200 ${
            isCollapsed ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 visible'
        }`}
      >
        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-800">
             <button 
                onClick={() => onViewModeChange('live')}
                className={`flex-1 py-3 text-[10px] md:text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'live' ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-400' : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
             >
                 <Wifi className="w-3 h-3" />
                 Live
             </button>
             <button 
                onClick={() => onViewModeChange('museum')}
                className={`flex-1 py-3 text-[10px] md:text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'museum' ? 'bg-slate-900 text-red-400 border-b-2 border-red-500' : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
             >
                 <Landmark className="w-3 h-3" />
                 Museum
             </button>
             <button 
                onClick={() => onViewModeChange('lab')}
                className={`flex-1 py-3 text-[10px] md:text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'lab' ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500' : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
             >
                 <Beaker className="w-3 h-3" />
                 Lab
             </button>
        </div>

        {viewMode === 'live' && (
        <>
            <div className="flex-none px-6 py-6 border-b border-cyan-900/30 bg-slate-900/80 relative overflow-hidden">
                <div className="absolute inset-0 bg-scanline pointer-events-none opacity-30"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/50 bg-cyan-900/20">
                            <Radio className="w-5 h-5 text-cyan-400" />
                            <span className="absolute inset-0 rounded-full border border-cyan-400 opacity-50 animate-ping"></span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-[0.2em] text-cyan-50 font-mono leading-none">SENTINEL</h1>
                            <p className="text-[10px] text-cyan-500 uppercase tracking-widest mt-1 font-semibold">Seismic Array v2.0</p>
                        </div>
                    </div>
                    <div className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-mono tracking-widest">LIVE FEED</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                            {lastUpdated.toISOString().split('T')[1].split('.')[0]} UTC
                        </div>
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50"></div>
                            <div className="flex items-center gap-2 mb-1">
                                <Database className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Events</span>
                            </div>
                            <span className="text-xl font-mono text-slate-200 group-hover:text-cyan-400 transition-colors block text-right">{totalEvents}</span>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/50"></div>
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Max Mag</span>
                            </div>
                            <span className={`text-xl font-mono text-right block ${getMagColor(maxMag).split(' ')[0]}`}>{maxMag.toFixed(1)}</span>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/50"></div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Network</span>
                            <span className="text-xs font-mono text-emerald-400 text-right block tracking-widest">ACTIVE</span>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <div className="relative group flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearch(e.target.value)}
                                placeholder="QUERY LOC OR MAG (e.g. >5)..."
                                className="block w-full pl-10 pr-3 py-2 border border-slate-800 bg-slate-950/80 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono uppercase tracking-wide transition-all"
                            />
                        </div>
                        {userLocation && (
                            <button
                                onClick={() => setSortBy(prev => prev === 'time' ? 'distance' : 'time')}
                                className={`px-3 border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                                    sortBy === 'distance' 
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500' 
                                    : 'bg-slate-950/80 text-slate-500 border-slate-800 hover:text-slate-300'
                                }`}
                                title="Toggle Sort by Proximity"
                            >
                                <Navigation className={`w-3 h-3 ${sortBy === 'distance' ? 'rotate-0' : 'rotate-45 transition-transform'}`} />
                                {sortBy === 'distance' ? 'NEARBY' : 'RECENT'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative bg-slate-950/80">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 z-0 ml-6"></div>

                {sortedEarthquakes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm font-mono">
                        <p>NO SIGNAL DETECTED</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-800/40 relative z-10">
                    {sortedEarthquakes.map((quake) => {
                        const isLocalAlert = quake.distanceToUser !== null && quake.distanceToUser < 500;
                        
                        return (
                            <li 
                                key={quake.id} 
                                onClick={() => onSelect(quake.id, quake)}
                                className={`group pl-6 pr-4 py-4 cursor-pointer transition-all duration-200 border-l-2 hover:bg-slate-900/50 ${
                                    selectedId === quake.id 
                                    ? 'bg-slate-900 border-cyan-500' 
                                    : isLocalAlert
                                        ? 'border-red-500 bg-red-950/10'
                                        : 'border-transparent hover:border-slate-700'
                                }`}
                            >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1">
                                    <MapPin className={`w-3 h-3 mt-1 flex-shrink-0 ${
                                        selectedId === quake.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                                    }`} />
                                    <h4 className={`text-sm font-bold leading-tight truncate w-full font-mono uppercase ${
                                        selectedId === quake.id ? 'text-cyan-50' : 'text-slate-400 group-hover:text-slate-200'
                                    }`}>
                                        {quake.properties.place}
                                    </h4>
                                </div>
                                
                                {isLocalAlert && (
                                    <div className="flex items-center gap-1.5 ml-5 mb-1 text-red-500 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-[10px] font-bold tracking-wider uppercase">LOCAL ALERT (&lt;500KM)</span>
                                    </div>
                                )}

                                {quake.properties.tsunami === 1 && (
                                    <div className="flex items-center gap-1.5 ml-5 mb-1 text-cyan-400 animate-pulse">
                                        <Waves className="w-3 h-3" />
                                        <span className="text-[10px] font-bold tracking-wider uppercase">TSUNAMI WARNING</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pl-5">
                                    <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                                        <Clock className="w-2.5 h-2.5" /> 
                                        {formatTimeAgo(quake.properties.time)}
                                    </span>
                                    
                                    {quake.distanceToUser !== null && (
                                        <span className={`text-[10px] flex items-center gap-1.5 font-mono ${isLocalAlert ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                                            <Navigation className="w-2.5 h-2.5" />
                                            {Math.round(quake.distanceToUser).toLocaleString()} KM
                                        </span>
                                    )}

                                    <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                                        <Activity className="w-2.5 h-2.5" /> 
                                        {quake.geometry.coordinates[2]} KM
                                    </span>
                                </div>
                                </div>

                                <div className={`flex flex-col items-center justify-center w-10 h-10 border bg-slate-950/50 ${getMagColor(quake.properties.mag)}`}>
                                    <span className="text-sm font-bold font-mono">{quake.properties.mag.toFixed(1)}</span>
                                </div>
                            </div>
                            </li>
                        );
                    })}
                    </ul>
                )}
            </div>
        </>
        )}

        {viewMode === 'museum' && (
            <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Landmark className="w-48 h-48 text-red-500" />
                </div>
                
                {activeLegend ? (
                    <div className="relative z-10 space-y-6 animate-fadeIn">
                        <div>
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <Landmark className="w-4 h-4" />
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Hall of Legends</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white font-mono leading-tight">{activeLegend.place}</h2>
                            <p className="text-red-400 font-mono text-xl mt-1">{activeLegend.year}</p>
                        </div>

                        <div className="flex items-center gap-4 py-4 border-y border-red-900/30">
                            <div className="w-24 h-24 flex items-center justify-center border-4 border-red-500 text-red-500 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <span className="text-5xl font-bold font-mono">{activeLegend.mag}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Magnitude</div>
                                <div className="text-sm text-slate-300">Richter Scale</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-3 border-l-2 border-red-500/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <Skull className="w-3 h-3" />
                                    <span className="text-[10px] uppercase tracking-wider">Casualties</span>
                                </div>
                                <div className="font-mono text-lg text-slate-200">{activeLegend.casualties}</div>
                            </div>
                            <div className="bg-slate-900/50 p-3 border-l-2 border-cyan-500/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <Activity className="w-3 h-3" />
                                    <span className="text-[10px] uppercase tracking-wider">Depth</span>
                                </div>
                                <div className="font-mono text-lg text-slate-200">{activeLegend.depth} km</div>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 p-4 border border-slate-800">
                            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Historical Context</h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-sans border-l-2 border-slate-700 pl-4">
                                {activeLegend.description}
                            </p>
                        </div>
                        
                        <div className="text-[10px] text-slate-600 font-mono pt-10 text-center">
                            ARCHIVE RECORD ID: #{activeLegend.id.toUpperCase()}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p>Select an event from the timeline</p>
                    </div>
                )}
            </div>
        )}

        {viewMode === 'lab' && (
            <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Beaker className="w-48 h-48 text-purple-500" />
                </div>

                <div className="relative z-10 space-y-6">
                     {/* Header */}
                     <div>
                        <div className="flex items-center gap-2 text-purple-500 mb-2">
                            <Beaker className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Seismic Laboratory</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white font-mono leading-tight">EXPERIMENT CONSOLE</h2>
                    </div>
                    
                    {/* LAB SUB-NAVIGATION */}
                    <div className="flex border border-slate-800 rounded-lg p-1 bg-slate-900/50">
                        <button
                            onClick={() => onLabTabChange('impact')}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                                labTab === 'impact' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Impact Sim
                        </button>
                        <button
                            onClick={() => onLabTabChange('wave')}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                                labTab === 'wave' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Wave Analysis
                        </button>
                    </div>

                    {labTab === 'impact' ? (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-purple-400 font-mono text-xs leading-relaxed">
                            Adjust parameters to visualize the relationship between energy release, depth attenuation, and surface intensity.
                        </p>
                        
                        {/* Sliders */}
                        <div className="space-y-6 bg-slate-900/50 p-4 border border-slate-800">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Magnitude</span>
                                    </div>
                                    <span className="font-mono text-xl font-bold text-white">{labState.mag.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    step="0.1"
                                    value={labState.mag}
                                    onChange={(e) => onLabStateChange({...labState, mag: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                                />
                                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                                    <span>1.0</span>
                                    <span>10.0</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Layers className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Depth (KM)</span>
                                    </div>
                                    <span className="font-mono text-xl font-bold text-white">{labState.depth} km</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="700" 
                                    step="10"
                                    value={labState.depth}
                                    onChange={(e) => onLabStateChange({...labState, depth: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                                />
                                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                                    <span>0 km (Surface)</span>
                                    <span>700 km (Deep)</span>
                                </div>
                            </div>
                        </div>

                        {/* Output Card */}
                        <div className="bg-purple-950/20 border border-purple-500/30 p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500/50"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/50"></div>
                            
                            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">TNT Equivalence</h4>
                            
                            <div className="text-center space-y-2">
                                 <div className="text-xl md:text-2xl font-bold text-white font-mono leading-tight drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                    {getTNTEquivalent(labState.mag)}
                                 </div>
                                 <div className="text-xs font-mono text-purple-300">
                                    Energy Release: {getEnergyJoules(labState.mag)}
                                 </div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400 leading-relaxed font-mono p-3 bg-slate-900 border-l-2 border-slate-700">
                            <strong className="text-slate-200">NOTE:</strong> As depth increases, the seismic waves attenuate (weaken) before reaching the surface. This causes the "Felt Radius" to shrink, even though the total energy release remains the same.
                        </div>
                    </div>
                    ) : (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-blue-400 font-mono text-xs leading-relaxed">
                            Simulate P-Wave and S-Wave propagation to understand the delay between the initial jolt and heavy shaking.
                        </p>

                        {/* Steps */}
                        <div className="space-y-2">
                             <div className={`p-3 border rounded-md flex items-center gap-3 transition-colors ${!waveSim.station ? 'bg-blue-900/30 border-blue-500 text-blue-100 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                 <div className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center font-bold rounded-sm text-xs">1</div>
                                 <div className="text-xs font-mono uppercase tracking-wide">
                                     {!waveSim.station ? 'Click Map to Place Seismometer' : 'Station Deployed'}
                                 </div>
                                 {!waveSim.station && <MousePointer2 className="w-4 h-4 ml-auto" />}
                             </div>
                             
                             <div className={`p-3 border rounded-md flex items-center gap-3 transition-colors ${waveSim.station && !waveSim.epicenter ? 'bg-red-900/30 border-red-500 text-red-100 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                 <div className="bg-red-500 text-white w-6 h-6 flex items-center justify-center font-bold rounded-sm text-xs">2</div>
                                 <div className="text-xs font-mono uppercase tracking-wide">
                                     {!waveSim.epicenter ? 'Click Map to Trigger Quake' : 'Epicenter Designated'}
                                 </div>
                                 {waveSim.station && !waveSim.epicenter && <Target className="w-4 h-4 ml-auto" />}
                             </div>
                        </div>

                        {/* Telemetry Panel */}
                        {waveStats && (
                            <div className="bg-slate-900 border border-slate-700 p-4 space-y-4 font-mono">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-xs text-slate-500 uppercase">Distance</span>
                                    <span className="text-sm font-bold text-white">{Math.round(waveStats.dist)} km</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <div className="text-[10px] text-yellow-500 uppercase tracking-widest mb-1">P-Wave (Fast)</div>
                                         <div className="text-lg font-bold text-white">{waveStats.pTime.toFixed(1)} s</div>
                                         <div className="text-[9px] text-slate-500">Speed: ~6 km/s</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] text-red-500 uppercase tracking-widest mb-1">S-Wave (Slow)</div>
                                         <div className="text-lg font-bold text-white">{waveStats.sTime.toFixed(1)} s</div>
                                         <div className="text-[9px] text-slate-500">Speed: ~3.5 km/s</div>
                                     </div>
                                </div>

                                <div className="pt-2">
                                    <div className="text-[10px] text-slate-400 uppercase text-center mb-1">Warning Time (S-P Gap)</div>
                                    <div className="text-center text-xl font-bold text-cyan-400">
                                        {(waveStats.sTime - waveStats.pTime).toFixed(1)} s
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={onWaveReset}
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-bold uppercase text-xs flex items-center gap-2 border border-slate-600 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button 
                                onClick={onWaveStart}
                                disabled={!waveSim.station || !waveSim.epicenter || waveSim.isRunning}
                                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-md font-bold uppercase text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                            >
                                <Play className="w-4 h-4" /> 
                                {waveSim.isRunning ? 'Simulating...' : 'Trigger Simulation'}
                            </button>
                        </div>
                        
                        {waveSim.isRunning && (
                             <div className="text-center font-mono text-xs text-cyan-400 animate-pulse">
                                 ELAPSED TIME: {waveSim.elapsedTime.toFixed(1)} s
                             </div>
                        )}
                    </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Footer / Credits */}
        <div className="flex-none p-3 border-t border-slate-800 bg-slate-950 text-center">
            <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">
                {viewMode === 'live' ? 'USGS SEISMIC FEED // SECURE LINK' : viewMode === 'museum' ? 'HISTORICAL ARCHIVE // READ ONLY' : 'SIMULATION ENVIRONMENT // UNCLASSIFIED'}
            </p>
        </div>
      </div>

      {/* COLLAPSED STATE PLACEHOLDER (Desktop Only) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center py-10 gap-8 hidden md:flex transition-opacity duration-300 delay-100 ${
             isCollapsed ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
          {/* Logo Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/50 bg-cyan-900/20 flex-none mt-8">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="absolute inset-0 rounded-full border border-cyan-400 opacity-50 animate-ping"></span>
          </div>

          {/* Vertical Text */}
          <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
               <div className="-rotate-90 whitespace-nowrap text-[10px] font-mono font-bold tracking-[0.3em] text-slate-500 flex items-center gap-4 uppercase select-none">
                  <span className={lastUpdated ? "text-emerald-500 animate-pulse" : ""}>●</span>
                  <span>Sentinel Array // {viewMode === 'live' ? 'Live' : viewMode === 'museum' ? 'Archive' : 'Lab'}</span>
               </div>
          </div>
          
          <div className="flex-none text-slate-700 mb-4">
             <Wifi className="w-4 h-4" />
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
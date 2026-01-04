import React, { useMemo, useState, useEffect } from 'react';
import { EarthquakeFeature, LegendEvent } from '../types';
import { Activity, Radio, Clock, MapPin, Search, Database, BarChart3, Wifi, Waves, Navigation, AlertTriangle, PanelLeftClose, PanelLeftOpen, Landmark, Skull, Beaker, Zap, Layers, Play, RotateCcw, Target, MousePointer2, ClipboardCheck, ShieldAlert, CheckSquare, Siren, Hammer, ChevronRight, LineChart, AlertOctagon } from 'lucide-react';

interface SidebarProps {
  viewMode: 'live' | 'museum' | 'lab' | 'protocols';
  onViewModeChange: (mode: 'live' | 'museum' | 'lab' | 'protocols') => void;
  earthquakes: EarthquakeFeature[];
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  selectedId: string | null;
  lastUpdated: Date;
  searchQuery: string;
  onSearch: (query: string) => void;
  userLocation: { lat: number; lng: number } | null;
  activeLegend: LegendEvent | null;
  labState: { mag: number; depth: number; location: { lat: number; lng: number } | null };
  onLabStateChange: (state: { mag: number; depth: number; location: { lat: number; lng: number } | null }) => void;
  labTab: 'impact' | 'wave' | 'forecast';
  onLabTabChange: (tab: 'impact' | 'wave' | 'forecast') => void;
  waveSim: {
      station: { lat: number; lng: number } | null;
      epicenter: { lat: number; lng: number } | null;
      isRunning: boolean;
      elapsedTime: number;
  };
  onWaveReset: () => void;
  onWaveStart: () => void;
}

const GO_BAG_ITEMS = [
    { id: 'water', label: 'Water (1 gal/person/day)' },
    { id: 'food', label: 'Non-perishable Food (3 days)' },
    { id: 'flashlight', label: 'Flashlight + Extra Batteries' },
    { id: 'firstaid', label: 'First Aid Kit' },
    { id: 'whistle', label: 'Whistle (Signal for help)' },
    { id: 'mask', label: 'Dust Mask (N95)' },
    { id: 'wipes', label: 'Moist Towelettes / Garbage Bags' },
    { id: 'wrench', label: 'Wrench/Pliers (Utilities)' },
    { id: 'canopener', label: 'Manual Can Opener' },
    { id: 'maps', label: 'Local Maps (Paper)' },
    { id: 'powerbank', label: 'Portable Power Bank' },
    { id: 'radio', label: 'Hand-crank / Battery Radio' }
];

// Helper to calculate energy in Joules
const calculateEnergy = (mag: number) => {
    // Gutenberg-Richter energy formula: log E = 4.8 + 1.5M
    // E = 10^(4.8 + 1.5M)
    return Math.pow(10, 4.8 + 1.5 * mag);
};

// Helper to format large numbers
const formatEnergy = (joules: number) => {
    if (joules > 1e15) return `${(joules / 1e15).toFixed(2)} PJ`; // PetaJoules
    if (joules > 1e12) return `${(joules / 1e12).toFixed(2)} TJ`; // TeraJoules
    if (joules > 1e9) return `${(joules / 1e9).toFixed(2)} GJ`; // GigaJoules
    return `${(joules / 1e6).toFixed(2)} MJ`; // MegaJoules
};

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
  
  // Protocols State
  const [protocolTab, setProtocolTab] = useState<'during' | 'after' | 'tsunami'>('during');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Load Checklist from LocalStorage
  useEffect(() => {
      const saved = localStorage.getItem('sentinel_gobag');
      if (saved) {
          try {
              setChecklist(JSON.parse(saved));
          } catch (e) {
              console.error("Failed to parse checklist", e);
          }
      }
  }, []);

  // Save Checklist
  const toggleCheckItem = (id: string) => {
      const updated = { ...checklist, [id]: !checklist[id] };
      setChecklist(updated);
      localStorage.setItem('sentinel_gobag', JSON.stringify(updated));
  };

  const checklistProgress = useMemo(() => {
      const total = GO_BAG_ITEMS.length;
      const checked = GO_BAG_ITEMS.filter(i => checklist[i.id]).length;
      return Math.round((checked / total) * 100);
  }, [checklist]);

  // Stats Calculation
  const totalEvents = earthquakes.length;
  const maxMag = earthquakes.reduce((max, q) => (q.properties.mag > max ? q.properties.mag : max), 0);
  
  // -- FORECAST/ANALYTICS CALCULATIONS --
  const analyticsData = useMemo(() => {
    if (earthquakes.length === 0) return null;

    // 1. Total Energy
    let totalEnergyJoules = 0;
    earthquakes.forEach(q => {
        totalEnergyJoules += calculateEnergy(q.properties.mag);
    });

    // 2. Mainshock
    const mainshock = earthquakes.reduce((prev, current) => 
        (prev.properties.mag > current.properties.mag) ? prev : current
    );

    // 3. Frequency Distribution
    const distribution = {
        micro: 0, // <3
        minor: 0, // 3-3.9
        light: 0, // 4-4.9
        moderate: 0, // 5-5.9
        strong: 0 // 6+
    };

    earthquakes.forEach(q => {
        const m = q.properties.mag;
        if (m < 3) distribution.micro++;
        else if (m < 4) distribution.minor++;
        else if (m < 5) distribution.light++;
        else if (m < 6) distribution.moderate++;
        else distribution.strong++;
    });

    // 4. Forecast Text Generation (Bath's Law / Omori's Law approximation)
    let forecastText = "";
    if (mainshock.properties.mag < 4.5) {
        forecastText = "Seismicity levels are currently normal (background level). No significant aftershock sequences are expected based on current data.";
    } else if (mainshock.properties.mag < 6.0) {
        forecastText = `A Magnitude ${mainshock.properties.mag.toFixed(1)} event typically generates a short aftershock sequence. Expect several events of Mag ${Math.max(0, mainshock.properties.mag - 1.2).toFixed(1)} or greater in the next 24-48 hours.`;
    } else {
        forecastText = `ALERT: Significant energy release detected (M${mainshock.properties.mag.toFixed(1)}). Statistical models (Bath's Law) suggest a high probability of a Mag ${(mainshock.properties.mag - 1.2).toFixed(1)}+ aftershock. Secondary aftershocks may persist for weeks.`;
    }

    return { totalEnergyJoules, mainshock, distribution, forecastText };
  }, [earthquakes]);


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

  // --- RENDER HELPERS ---
  const NavButton = ({ id, icon: Icon, color, label }: { id: typeof viewMode, icon: any, color: string, label: string }) => {
      const active = viewMode === id;
      
      // Dynamic class mapping for Tailwind JIT
      let activeClasses = "";
      let indicatorColor = "";
      
      if (color === "cyan") {
          activeClasses = "bg-cyan-900/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]";
          indicatorColor = "bg-cyan-500";
      } else if (color === "red") {
          activeClasses = "bg-red-900/30 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
          indicatorColor = "bg-red-500";
      } else if (color === "purple") {
          activeClasses = "bg-purple-900/30 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
          indicatorColor = "bg-purple-500";
      } else if (color === "green") {
          activeClasses = "bg-green-900/30 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
          indicatorColor = "bg-green-500";
      }

      return (
        <button
            onClick={() => onViewModeChange(id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative group border ${
                active 
                ? activeClasses
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
        >
            <Icon className="w-5 h-5" />
            
            {/* Active Indicator Bar */}
            {active && (
                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${indicatorColor}`}></div>
            )}

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold font-mono uppercase text-slate-200 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity translate-x-1 group-hover:translate-x-0">
                {label}
            </div>
        </button>
      );
  };

  return (
    <div 
        className={`flex flex-col md:flex-row h-full bg-slate-950 border-r border-slate-800/80 relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] w-full ${
            isCollapsed ? 'md:w-[64px]' : 'md:w-[450px]'
        }`}
    >
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

      {/* --- DESKTOP NAVIGATION RAIL --- */}
      <div className="hidden md:flex flex-col items-center py-4 gap-6 w-[64px] border-r border-slate-800 bg-slate-950 z-50 flex-none">
          {/* Logo */}
          <div className="w-10 h-10 rounded-full bg-cyan-900/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-2 relative group cursor-default">
              <Radio className="w-5 h-5" />
              <span className="absolute inset-0 rounded-full border border-cyan-400 opacity-50 animate-ping"></span>
          </div>

          <div className="flex flex-col gap-3 w-full items-center">
              <NavButton id="live" icon={Wifi} color="cyan" label="Live Feed" />
              <NavButton id="museum" icon={Landmark} color="red" label="Archive" />
              <NavButton id="lab" icon={Beaker} color="purple" label="Sim Lab" />
              <NavButton id="protocols" icon={ShieldAlert} color="green" label="Protocols" />
          </div>

          <div className="mt-auto">
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
                title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
             >
                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
             </button>
          </div>
      </div>

      {/* --- MOBILE NAVIGATION TABS (Visible only on small screens) --- */}
      <div className="md:hidden flex border-b border-slate-800 flex-none">
             <button 
                onClick={() => onViewModeChange('live')}
                className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'live' ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-400' : 'bg-slate-950 text-slate-500'
                }`}
             >
                 <Wifi className="w-3 h-3" /> Live
             </button>
             <button 
                onClick={() => onViewModeChange('museum')}
                className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'museum' ? 'bg-slate-900 text-red-400 border-b-2 border-red-500' : 'bg-slate-950 text-slate-500'
                }`}
             >
                 <Landmark className="w-3 h-3" /> Museum
             </button>
             <button 
                onClick={() => onViewModeChange('lab')}
                className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'lab' ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500' : 'bg-slate-950 text-slate-500'
                }`}
             >
                 <Beaker className="w-3 h-3" /> Lab
             </button>
             <button 
                onClick={() => onViewModeChange('protocols')}
                className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'protocols' ? 'bg-slate-900 text-green-400 border-b-2 border-green-500' : 'bg-slate-950 text-slate-500'
                }`}
             >
                 <ShieldAlert className="w-3 h-3" /> Kit
             </button>
      </div>

      {/* --- CONTENT DRAWER --- */}
      <div 
        className={`flex-1 flex flex-col h-full bg-slate-950/95 overflow-hidden transition-all duration-300 relative ${
            isCollapsed ? 'md:w-0 md:opacity-0 pointer-events-none' : 'md:w-auto opacity-100'
        }`}
      >
        
        {viewMode === 'live' && (
        <>
            <div className="flex-none px-6 py-6 border-b border-cyan-900/30 bg-slate-900/80 relative overflow-hidden">
                <div className="absolute inset-0 bg-scanline pointer-events-none opacity-30"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile Logo Only (Desktop is in Rail) */}
                        <div className="md:hidden relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/50 bg-cyan-900/20">
                            <Radio className="w-5 h-5 text-cyan-400" />
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
                                    <div className="flex items-center gap-1.5 ml-5 mb-1 bg-cyan-950/40 border border-cyan-500/50 px-2 py-0.5 rounded-sm w-fit animate-pulse">
                                        <Waves className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-100">TSUNAMI WARNING</span>
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
                        <button
                            onClick={() => onLabTabChange('forecast')}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                                labTab === 'forecast' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Forecast
                        </button>
                    </div>

                    {labTab === 'impact' && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-purple-400 font-mono text-xs leading-relaxed">
                            Adjust parameters to visualize the relationship between energy release, depth attenuation, and surface intensity.
                        </p>
                        
                        {/* Sliders */}
                        <div className="space-y-6 bg-slate-900/50 p-4 border border-slate-800">
                             {/* Location Status */}
                             <div className={`p-3 border rounded-md flex items-center gap-3 transition-colors ${!labState.location ? 'bg-purple-900/30 border-purple-500 text-purple-100 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                 <MousePointer2 className="w-4 h-4" />
                                 <div className="text-xs font-mono uppercase tracking-wide">
                                     {!labState.location ? 'Click Map to set Ground Zero' : `Target: ${labState.location.lat.toFixed(2)}, ${labState.location.lng.toFixed(2)}`}
                                 </div>
                             </div>

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
                    )}

                    {labTab === 'wave' && (
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
                                         <div className={`text-lg font-bold transition-colors ${waveSim.elapsedTime >= waveStats.pTime ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>{waveStats.pTime.toFixed(1)} s</div>
                                         <div className="text-[9px] text-slate-500">Speed: ~6 km/s</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] text-red-500 uppercase tracking-widest mb-1">S-Wave (Slow)</div>
                                         <div className={`text-lg font-bold transition-colors ${waveSim.elapsedTime >= waveStats.sTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>{waveStats.sTime.toFixed(1)} s</div>
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

                    {labTab === 'forecast' && analyticsData && (
                        <div className="space-y-6 animate-fadeIn">
                            <p className="text-amber-400 font-mono text-xs leading-relaxed">
                                Statistical analysis of the last 24 hours of seismic data to model energy release and aftershock probability.
                            </p>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-900 border border-slate-700 p-3">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Energy</div>
                                    <div className="text-lg font-bold text-white font-mono">{formatEnergy(analyticsData.totalEnergyJoules)}</div>
                                </div>
                                <div className="bg-slate-900 border border-slate-700 p-3 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => onSelect(analyticsData.mainshock.id, analyticsData.mainshock)}>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        Mainshock <MousePointer2 className="w-3 h-3" />
                                    </div>
                                    <div className="text-lg font-bold text-red-500 font-mono">M{analyticsData.mainshock.properties.mag.toFixed(1)}</div>
                                </div>
                            </div>

                            {/* Frequency Distribution Chart */}
                            <div className="bg-slate-900/50 border border-slate-800 p-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-3 h-3" /> Frequency-Magnitude Distribution
                                </h4>
                                <div className="h-32 flex items-end gap-2 px-2 pb-2 border-b border-l border-slate-700">
                                    {Object.entries(analyticsData.distribution).map(([key, rawCount]) => {
                                        const count = rawCount as number;
                                        const values = Object.values(analyticsData.distribution) as number[];
                                        const max = Math.max(...values, 1);
                                        const height = (count / max) * 100;
                                        
                                        // Colors based on magnitude range logic
                                        let bg = 'bg-slate-600';
                                        if (key === 'minor') bg = 'bg-emerald-500';
                                        if (key === 'light') bg = 'bg-yellow-500';
                                        if (key === 'moderate') bg = 'bg-orange-500';
                                        if (key === 'strong') bg = 'bg-red-500';

                                        return (
                                            <div key={key} className="flex-1 h-full flex flex-col items-center group">
                                                {/* Bar Area */}
                                                <div className="flex-1 w-full flex items-end justify-center relative">
                                                    <div 
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${bg} opacity-80 group-hover:opacity-100 relative`} 
                                                        style={{ height: `${Math.max(height, 2)}%` }}
                                                    >
                                                        {/* Tooltip */}
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1 rounded border border-slate-700 pointer-events-none z-20 whitespace-nowrap">
                                                            {count}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Label */}
                                                <div className="h-4 flex items-center justify-center mt-1">
                                                    <span className="text-[9px] text-slate-500 uppercase font-mono">{key.slice(0, 3)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-[9px] text-center text-slate-600 mt-2 font-mono">MAGNITUDE CLASS (24H)</div>
                            </div>

                            {/* Forecast Report */}
                            <div className="bg-amber-950/20 border border-amber-500/30 p-4 relative">
                                <div className="absolute top-0 right-0 p-2">
                                    <AlertOctagon className="w-4 h-4 text-amber-500 animate-pulse" />
                                </div>
                                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Aftershock Probability Report</h4>
                                <p className="text-xs text-amber-100/80 leading-relaxed font-mono">
                                    {analyticsData.forecastText}
                                </p>
                            </div>

                            <div className="text-[9px] text-slate-500 italic p-2 border-l-2 border-slate-700 bg-slate-900/50">
                                <strong>DISCLAIMER:</strong> This is a statistical model based on Gutenberg-Richter and Omori laws. It is not a prediction of future events. Earthquakes cannot be predicted with precision.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {viewMode === 'protocols' && (
            <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <ShieldAlert className="w-48 h-48 text-green-500" />
                </div>

                <div className="relative z-10 space-y-8">
                     {/* Header */}
                     <div>
                        <div className="flex items-center gap-2 text-green-500 mb-2">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Emergency Protocols</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white font-mono leading-tight">PREPAREDNESS KIT</h2>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Readiness Level</span>
                                <span className={`font-mono font-bold ${checklistProgress === 100 ? 'text-green-400' : 'text-slate-200'}`}>
                                    {checklistProgress}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${checklistProgress === 100 ? 'bg-green-500' : 'bg-green-600/50'}`}
                                    style={{ width: `${checklistProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Go-Bag Checklist */}
                    <div className="bg-slate-900/50 border border-slate-700 p-4">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                             <CheckSquare className="w-4 h-4" />
                             <h3 className="text-xs font-bold uppercase tracking-widest">Go-Bag Diagnostic</h3>
                        </div>
                        <div className="space-y-1">
                            {GO_BAG_ITEMS.map((item) => {
                                const isChecked = !!checklist[item.id];
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => toggleCheckItem(item.id)}
                                        className={`flex items-center gap-3 p-2 cursor-pointer border border-transparent hover:bg-slate-800/50 transition-colors group ${isChecked ? 'text-green-100' : 'text-slate-500'}`}
                                    >
                                        <div className={`font-mono text-xs font-bold ${isChecked ? 'text-green-500' : 'text-slate-700'}`}>
                                            [{isChecked ? ' OK ' : ' -- '}]
                                        </div>
                                        <div className="text-xs font-medium flex-1">{item.label}</div>
                                        {isChecked && <CheckSquare className="w-3 h-3 text-green-500 opacity-50" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Emergency Guide Tabs */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Siren className="w-4 h-4" /> Emergency Action Guide
                        </h3>
                        
                        <div className="flex border border-slate-800 rounded-t-lg bg-slate-900/50">
                             <button
                                onClick={() => setProtocolTab('during')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${protocolTab === 'during' ? 'bg-slate-800 text-white border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                During
                             </button>
                             <button
                                onClick={() => setProtocolTab('after')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${protocolTab === 'after' ? 'bg-slate-800 text-white border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                After
                             </button>
                             <button
                                onClick={() => setProtocolTab('tsunami')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${protocolTab === 'tsunami' ? 'bg-slate-800 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                Tsunami
                             </button>
                        </div>

                        <div className="bg-slate-900 border border-t-0 border-slate-800 p-4 rounded-b-lg">
                             {protocolTab === 'during' && (
                                 <div className="space-y-4 animate-fadeIn">
                                     <div className="flex gap-4 items-start">
                                         <div className="w-10 h-10 bg-red-900/30 border border-red-500/50 flex items-center justify-center text-red-500 font-bold text-lg rounded">1</div>
                                         <div>
                                             <h4 className="text-red-400 font-bold uppercase text-sm mb-1">DROP, COVER, HOLD ON</h4>
                                             <p className="text-xs text-slate-400 leading-relaxed">
                                                 Drop to your hands and knees. Cover your head and neck with your arms. Hold on to any sturdy furniture until the shaking stops.
                                             </p>
                                         </div>
                                     </div>
                                     <div className="flex gap-4 items-start">
                                         <div className="w-10 h-10 bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-bold text-lg rounded">2</div>
                                         <div>
                                             <h4 className="text-slate-200 font-bold uppercase text-sm mb-1">STAY INDOORS</h4>
                                             <p className="text-xs text-slate-400 leading-relaxed">
                                                 Do not run outside. Falling debris, glass, and building facades are the greatest hazards.
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {protocolTab === 'after' && (
                                 <div className="space-y-4 animate-fadeIn">
                                     <div className="flex gap-4 items-start">
                                         <div className="w-10 h-10 bg-yellow-900/30 border border-yellow-500/50 flex items-center justify-center text-yellow-500 font-bold text-lg rounded">
                                             <Hammer className="w-5 h-5" />
                                         </div>
                                         <div>
                                             <h4 className="text-yellow-400 font-bold uppercase text-sm mb-1">CHECK INFRASTRUCTURE</h4>
                                             <p className="text-xs text-slate-400 leading-relaxed">
                                                 Smell for gas. Check for electrical damage. If you suspect a leak, turn off utilities at the main valve.
                                             </p>
                                         </div>
                                     </div>
                                     <div className="flex gap-4 items-start">
                                         <div className="w-10 h-10 bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-bold text-lg rounded">!</div>
                                         <div>
                                             <h4 className="text-slate-200 font-bold uppercase text-sm mb-1">EXPECT AFTERSHOCKS</h4>
                                             <p className="text-xs text-slate-400 leading-relaxed">
                                                 Secondary shockwaves can collapse damaged structures. Stay alert and avoid elevators.
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {protocolTab === 'tsunami' && (
                                 <div className="space-y-4 animate-fadeIn">
                                     <div className="flex gap-4 items-start">
                                         <div className="w-10 h-10 bg-cyan-900/30 border border-cyan-500/50 flex items-center justify-center text-cyan-500 font-bold text-lg rounded">
                                             <Waves className="w-5 h-5" />
                                         </div>
                                         <div>
                                             <h4 className="text-cyan-400 font-bold uppercase text-sm mb-1">GET TO HIGH GROUND</h4>
                                             <p className="text-xs text-slate-400 leading-relaxed">
                                                 If you are near the coast and feel strong shaking, move inland or to high ground immediately. Do not wait for an official warning.
                                             </p>
                                         </div>
                                     </div>
                                     <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-300 text-[10px] font-mono">
                                         WARNING: Tsunami waves can arrive for hours. Do not return to the coast until officials declare it safe.
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Footer / Credits */}
        <div className="flex-none p-3 border-t border-slate-800 bg-slate-950 text-center">
            <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">
                {viewMode === 'live' ? 'USGS SEISMIC FEED // SECURE LINK' : viewMode === 'museum' ? 'HISTORICAL ARCHIVE // READ ONLY' : viewMode === 'lab' ? 'SIMULATION ENVIRONMENT // UNCLASSIFIED' : 'CIVIL DEFENSE PROTOCOLS'}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
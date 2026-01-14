import React, { useMemo, useState } from 'react';
import { EarthquakeFeature, LegendEvent, VolcanoFeature, SpaceWeather } from '../types';
import { Radio, Wifi, PanelLeftClose, PanelLeftOpen, Landmark, Beaker, ShieldAlert, Flame, Sun } from 'lucide-react';
import { calculateEnergy } from '../utils/formatting';
import { LiveFeed, MagmaMonitor, CosmicPanel, MuseumPanel, LabPanel, ProtocolsPanel } from './SidebarPanels';

interface SidebarProps {
  viewMode: 'live' | 'museum' | 'lab' | 'protocols' | 'magma' | 'cosmic';
  onViewModeChange: (mode: 'live' | 'museum' | 'lab' | 'protocols' | 'magma' | 'cosmic') => void;
  earthquakes: EarthquakeFeature[];
  volcanoes: VolcanoFeature[];
  spaceWeather: SpaceWeather | null;
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

const Sidebar: React.FC<SidebarProps> = ({ 
    viewMode,
    onViewModeChange,
    earthquakes,
    volcanoes, 
    spaceWeather,
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
  const [protocolTab, setProtocolTab] = useState<'preparedness' | 'response' | 'recovery'>('preparedness');

  const totalEvents = earthquakes.length;
  const maxMag = earthquakes.reduce((max, q) => ((q.properties.mag || 0) > max ? q.properties.mag : max), 0);
  
  // -- FORECAST/ANALYTICS CALCULATIONS --
  const analyticsData = useMemo(() => {
    if (earthquakes.length === 0) return null;

    let totalEnergyJoules = 0;
    earthquakes.forEach(q => {
        totalEnergyJoules += calculateEnergy(q.properties.mag || 0);
    });

    const mainshock = earthquakes.reduce((prev, current) => 
        ((prev.properties.mag || 0) > (current.properties.mag || 0)) ? prev : current
    );

    const distribution = {
        micro: 0, minor: 0, light: 0, moderate: 0, strong: 0
    };

    earthquakes.forEach(q => {
        const m = q.properties.mag || 0;
        if (m < 3) distribution.micro++;
        else if (m < 4) distribution.minor++;
        else if (m < 5) distribution.light++;
        else if (m < 6) distribution.moderate++;
        else distribution.strong++;
    });

    let forecastText = "";
    const mainshockMag = mainshock.properties.mag || 0;
    if (mainshockMag < 4.5) {
        forecastText = "Seismicity levels are currently normal. No significant aftershock sequences are expected based on current data.";
    } else if (mainshockMag < 6.0) {
        forecastText = `A Magnitude ${mainshockMag.toFixed(1)} event typically generates a short aftershock sequence. Expect several events of Mag ${Math.max(0, mainshockMag - 1.2).toFixed(1)} or greater.`;
    } else {
        forecastText = `ALERT: Significant energy release detected (M${mainshockMag.toFixed(1)}). Statistical models suggest a high probability of a Mag ${(mainshockMag - 1.2).toFixed(1)}+ aftershock.`;
    }

    return { totalEnergyJoules, mainshock, distribution, forecastText };
  }, [earthquakes]);

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
      const dist = R * c; 

      const pTime = dist / 6;
      const sTime = dist / 3.5;

      return { dist, pTime, sTime };
  };

  const waveStats = calculateWaveStats();

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

  const NavButton = ({ id, icon: Icon, color, label }: { id: typeof viewMode, icon: any, color: string, label: string }) => {
      const active = viewMode === id;
      let activeClasses = "";
      let indicatorColor = "";
      
      if (color === "cyan") { activeClasses = "bg-cyan-900/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"; indicatorColor = "bg-cyan-500"; }
      else if (color === "red") { activeClasses = "bg-red-900/30 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"; indicatorColor = "bg-red-500"; }
      else if (color === "purple") { activeClasses = "bg-purple-900/30 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]"; indicatorColor = "bg-purple-500"; }
      else if (color === "green") { activeClasses = "bg-green-900/30 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"; indicatorColor = "bg-green-500"; }
      else if (color === "orange") { activeClasses = "bg-orange-900/30 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]"; indicatorColor = "bg-orange-500"; }
      else if (color === "blue") { activeClasses = "bg-blue-900/30 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]"; indicatorColor = "bg-blue-500"; }

      return (
        <button
            onClick={() => onViewModeChange(id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative group border ${
                active ? activeClasses : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
        >
            <Icon className="w-5 h-5" />
            {active && <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${indicatorColor}`}></div>}
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold font-mono uppercase text-slate-200 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity translate-x-1 group-hover:translate-x-0 hidden md:block">
                {label}
            </div>
        </button>
      );
  };

  return (
    <div className={`flex flex-col md:flex-row h-full w-full bg-slate-950 transition-all duration-300 ${isCollapsed ? 'md:w-[64px]' : 'md:w-[450px]'}`}>
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

      {/* --- DESKTOP NAVIGATION RAIL --- */}
      <div className="hidden md:flex flex-col items-center py-4 gap-6 w-[64px] border-r border-slate-800 bg-slate-950 z-50 flex-none h-full">
          <div className="w-10 h-10 rounded-full bg-cyan-900/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-2 relative group cursor-default">
              <Radio className="w-5 h-5" />
              <span className="absolute inset-0 rounded-full border border-cyan-400 opacity-50 animate-ping"></span>
          </div>

          <div className="flex flex-col gap-3 w-full items-center">
              <NavButton id="live" icon={Wifi} color="cyan" label="Live Feed" />
              <NavButton id="museum" icon={Landmark} color="red" label="Archive" />
              <NavButton id="magma" icon={Flame} color="orange" label="Magma Monitor" />
              <NavButton id="cosmic" icon={Sun} color="blue" label="Cosmic" />
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

      {/* --- CONTENT DRAWER (Shared Mobile & Desktop) --- */}
      {/* 
         Mobile: Always flexible height, filling remaining space from parent 
         Desktop: Flexible width, clipped when collapsed 
      */}
      <div 
        className={`flex-1 flex flex-col h-full bg-slate-950/95 overflow-hidden relative transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:pointer-events-none' : 'w-full opacity-100'}`}
      >
        {viewMode === 'live' && <LiveFeed earthquakes={sortedEarthquakes} totalEvents={totalEvents} maxMag={maxMag} searchQuery={searchQuery} onSearch={onSearch} sortBy={sortBy} setSortBy={setSortBy} userLocation={userLocation} lastUpdated={lastUpdated} selectedId={selectedId} onSelect={onSelect} />}
        {viewMode === 'magma' && <MagmaMonitor volcanoes={volcanoes} />}
        {viewMode === 'cosmic' && <CosmicPanel spaceWeather={spaceWeather} />}
        {viewMode === 'museum' && <MuseumPanel activeLegend={activeLegend} />}
        {viewMode === 'lab' && <LabPanel labTab={labTab} onLabTabChange={onLabTabChange} labState={labState} onLabStateChange={onLabStateChange} waveSim={waveSim} waveStats={waveStats} onWaveReset={onWaveReset} onWaveStart={onWaveStart} analyticsData={analyticsData} onSelect={(id, f) => onSelect(id, f)} />}
        {viewMode === 'protocols' && <ProtocolsPanel protocolTab={protocolTab} setProtocolTab={setProtocolTab} />}
        
        {/* Footer / Credits (Desktop Only) */}
        <div className="hidden md:block flex-none p-3 border-t border-slate-800 bg-slate-950 text-center">
            <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">
                SENTINEL // PLANETARY MONITOR
            </p>
        </div>
      </div>
      
       {/* --- MOBILE BOTTOM NAVIGATION --- */}
       <div className="md:hidden flex border-t border-slate-800 bg-slate-950 flex-none overflow-x-auto no-scrollbar z-[60] h-16">
             <button onClick={() => onViewModeChange('live')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'live' ? 'text-cyan-400 bg-slate-900' : 'text-slate-500'}`}><Wifi className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Live</span></button>
             <button onClick={() => onViewModeChange('magma')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'magma' ? 'text-orange-400 bg-slate-900' : 'text-slate-500'}`}><Flame className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Magma</span></button>
             <button onClick={() => onViewModeChange('cosmic')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'cosmic' ? 'text-blue-400 bg-slate-900' : 'text-slate-500'}`}><Sun className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Cosmic</span></button>
             <button onClick={() => onViewModeChange('museum')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'museum' ? 'text-red-400 bg-slate-900' : 'text-slate-500'}`}><Landmark className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Archive</span></button>
             <button onClick={() => onViewModeChange('lab')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'lab' ? 'text-purple-400 bg-slate-900' : 'text-slate-500'}`}><Beaker className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Lab</span></button>
             <button onClick={() => onViewModeChange('protocols')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${viewMode === 'protocols' ? 'text-green-400 bg-slate-900' : 'text-slate-500'}`}><ShieldAlert className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">Kit</span></button>
      </div>
    </div>
  );
};

export default Sidebar;
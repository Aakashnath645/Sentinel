import React, { useMemo, useState } from 'react';
import { EarthquakeFeature } from '../types';
import { Activity, Radio, Clock, MapPin, Search, Database, BarChart3, Wifi, Waves, Navigation, AlertTriangle, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  earthquakes: EarthquakeFeature[];
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  selectedId: string | null;
  lastUpdated: Date;
  searchQuery: string;
  onSearch: (query: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    earthquakes, 
    onSelect, 
    selectedId, 
    lastUpdated, 
    searchQuery, 
    onSearch,
    userLocation
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

  // Haversine Distance Formula (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  // Process list with distance and sorting
  const sortedEarthquakes = useMemo(() => {
    // 1. Map to include distance
    const withDistance = earthquakes.map(q => {
        let dist = null;
        if (userLocation) {
            // GeoJSON is Lng, Lat
            dist = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                q.geometry.coordinates[1], 
                q.geometry.coordinates[0]
            );
        }
        return { ...q, distanceToUser: dist };
    });

    // 2. Sort
    if (sortBy === 'distance' && userLocation) {
        return withDistance.sort((a, b) => {
            if (a.distanceToUser === null) return 1;
            if (b.distanceToUser === null) return -1;
            return a.distanceToUser - b.distanceToUser;
        });
    } else {
        // Default sort by time (already mostly sorted, but enforce it)
        return withDistance.sort((a, b) => b.properties.time - a.properties.time);
    }
  }, [earthquakes, userLocation, sortBy]);

  return (
    <div 
        className={`flex flex-col h-full bg-slate-950 border-r border-slate-800/80 relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden w-full ${
            isCollapsed ? 'md:w-[60px]' : 'md:w-[450px]'
        }`}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

      {/* Collapse Toggle Button (Desktop Only) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-3 z-50 p-1.5 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-900/30 rounded-sm transition-colors hidden md:flex items-center justify-center border border-transparent hover:border-cyan-500/30"
        title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* MAIN CONTENT WRAPPER */}
      {/* Uses a fixed width inner container so contents don't squish during transition */}
      <div 
        className={`flex-1 flex flex-col h-full w-full md:w-[450px] transition-opacity duration-200 ${
            isCollapsed ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 visible'
        }`}
      >
        {/* Header Section */}
        <div className="flex-none px-6 py-6 border-b border-cyan-900/30 bg-slate-900/80 relative overflow-hidden">
            {/* Scanline overlay for header */}
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
                <div className="text-right pr-6"> {/* Added padding right to avoid overlap with toggle button */}
                    <div className="flex items-center justify-end gap-2 mb-1">
                        <Wifi className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500 font-mono tracking-widest">LIVE FEED</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                        {lastUpdated.toISOString().split('T')[1].split('.')[0]} UTC
                    </div>
                </div>
                </div>
                
                {/* HUD Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                    {/* Stat Card 1 */}
                    <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50"></div>
                        <div className="flex items-center gap-2 mb-1">
                            <Database className="w-3 h-3 text-slate-500" />
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Events</span>
                        </div>
                        <span className="text-xl font-mono text-slate-200 group-hover:text-cyan-400 transition-colors block text-right">{totalEvents}</span>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/50"></div>
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-3 h-3 text-slate-500" />
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Max Mag</span>
                        </div>
                        <span className={`text-xl font-mono text-right block ${getMagColor(maxMag).split(' ')[0]}`}>{maxMag.toFixed(1)}</span>
                    </div>

                    {/* Stat Card 3 (Status) */}
                    <div className="bg-slate-900/50 border border-slate-700 p-2 relative group overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/50"></div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Network</span>
                        <span className="text-xs font-mono text-emerald-400 text-right block tracking-widest">ACTIVE</span>
                    </div>
                </div>

                {/* Search Bar & Sort Toggle */}
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

        {/* List */}
        <div className="flex-1 overflow-y-auto relative bg-slate-950/80">
            {/* Decorative line */}
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
                                    ? 'border-red-500 bg-red-950/10' // Local Alert Style
                                    : 'border-transparent hover:border-slate-700'
                            }`}
                        >
                        <div className="flex justify-between items-start gap-3">
                            {/* Info Column */}
                            <div className="flex-1 min-w-0">
                            {/* Primary: Location */}
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
                            
                            {/* Local Alert Badge */}
                            {isLocalAlert && (
                                <div className="flex items-center gap-1.5 ml-5 mb-1 text-red-500 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">LOCAL ALERT (&lt;500KM)</span>
                                </div>
                            )}

                            {/* Tsunami Badge */}
                            {quake.properties.tsunami === 1 && (
                                <div className="flex items-center gap-1.5 ml-5 mb-1 text-cyan-400 animate-pulse">
                                    <Waves className="w-3 h-3" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">TSUNAMI WARNING</span>
                                </div>
                            )}

                            {/* Secondary: Metadata */}
                            <div className="flex items-center gap-4 pl-5">
                                <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                                    <Clock className="w-2.5 h-2.5" /> 
                                    {formatTimeAgo(quake.properties.time)}
                                </span>
                                
                                {/* Proximity Display */}
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

                            {/* Magnitude Badge */}
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
        
        {/* Footer / Credits */}
        <div className="flex-none p-3 border-t border-slate-800 bg-slate-950 text-center">
            <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">USGS SEISMIC FEED // SECURE LINK</p>
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
                  <span>Sentinel Array // Active</span>
               </div>
          </div>
          
          {/* Bottom Status */}
          <div className="flex-none text-slate-700 mb-4">
             <Wifi className="w-4 h-4" />
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
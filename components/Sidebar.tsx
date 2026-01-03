import React from 'react';
import { EarthquakeFeature } from '../types';
import { Activity, Radio, Clock, MapPin, Search, Database, BarChart3, Wifi } from 'lucide-react';

interface SidebarProps {
  earthquakes: EarthquakeFeature[];
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  selectedId: string | null;
  lastUpdated: Date;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ earthquakes, onSelect, selectedId, lastUpdated, searchQuery, onSearch }) => {
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

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 w-full md:w-[450px] relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>

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
            <div className="text-right">
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

            {/* Search Bar */}
            <div className="mt-4 relative group">
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
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto relative bg-slate-950/80">
        {/* Decorative line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 z-0 ml-6"></div>

        {earthquakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm font-mono">
                <p>NO SIGNAL DETECTED</p>
            </div>
        ) : (
            <ul className="divide-y divide-slate-800/40 relative z-10">
            {earthquakes.map((quake) => (
                <li 
                    key={quake.id} 
                    onClick={() => onSelect(quake.id, quake)}
                    className={`group pl-6 pr-4 py-4 cursor-pointer transition-all duration-200 border-l-2 hover:bg-slate-900/50 ${
                        selectedId === quake.id 
                        ? 'bg-slate-900 border-cyan-500' 
                        : 'border-transparent hover:border-slate-700'
                    }`}
                >
                <div className="flex justify-between items-start gap-3">
                    {/* Info Column */}
                    <div className="flex-1 min-w-0">
                    {/* Primary: Location */}
                    <div className="flex items-start gap-2 mb-1">
                        <MapPin className={`w-3 h-3 mt-1 flex-shrink-0 ${selectedId === quake.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                        <h4 className={`text-sm font-bold leading-tight truncate w-full font-mono uppercase ${selectedId === quake.id ? 'text-cyan-50' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {quake.properties.place}
                        </h4>
                    </div>
                    
                    {/* Secondary: Metadata */}
                    <div className="flex items-center gap-4 pl-5">
                        <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                            <Clock className="w-2.5 h-2.5" /> 
                            {formatTimeAgo(quake.properties.time)}
                        </span>
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
            ))}
            </ul>
        )}
      </div>
      
      {/* Footer / Credits */}
      <div className="flex-none p-3 border-t border-slate-800 bg-slate-950 text-center">
          <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">USGS SEISMIC FEED // SECURE LINK</p>
      </div>
    </div>
  );
};

export default Sidebar;
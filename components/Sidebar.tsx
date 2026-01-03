import React from 'react';
import { EarthquakeFeature } from '../types';
import { AlertTriangle, TrendingUp, Radio, Activity } from 'lucide-react';

interface SidebarProps {
  earthquakes: EarthquakeFeature[];
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  selectedId: string | null;
  lastUpdated: Date;
}

const Sidebar: React.FC<SidebarProps> = ({ earthquakes, onSelect, selectedId, lastUpdated }) => {
  // Stats Calculation
  const totalEvents = earthquakes.length;
  const maxMag = earthquakes.reduce((max, q) => (q.properties.mag > max ? q.properties.mag : max), 0);
  const mostRecent = earthquakes[0]; // Assumed sorted by fetch, but standard API returns desc time usually.
  
  // Format helper
  const formatTimeAgo = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 60000; // minutes
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    const hours = diff / 60;
    return `${Math.floor(hours)}h ago`;
  };

  const getMagColor = (mag: number) => {
    if (mag < 2.0) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (mag < 4.5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (mag < 6.0) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 shadow-xl z-20 w-full md:w-96 relative">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-teal-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider">SENTINEL</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
             <span>LIVE</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 uppercase">Events</span>
                <span className="text-lg font-bold text-slate-100">{totalEvents}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 uppercase">Max Mag</span>
                <span className={`text-lg font-bold ${getMagColor(maxMag).split(' ')[0]}`}>{maxMag.toFixed(1)}</span>
            </div>
             <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 uppercase">Recent</span>
                <span className="text-xs font-bold text-slate-100 mt-1">
                    {mostRecent ? formatTimeAgo(mostRecent.properties.time) : '--'}
                </span>
            </div>
        </div>
        <div className="mt-3 text-[10px] text-slate-600 text-right uppercase tracking-widest">
            Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-slate-800">
          {earthquakes.map((quake) => (
            <li 
                key={quake.id} 
                onClick={() => onSelect(quake.id, quake)}
                className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors border-l-4 ${
                    selectedId === quake.id ? 'bg-slate-800/80 border-teal-400' : 'border-transparent'
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-3">
                   <h4 className="text-sm font-semibold text-slate-200 truncate">{quake.properties.place}</h4>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {quake.geometry.coordinates[2]}km
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {formatTimeAgo(quake.properties.time)}
                      </span>
                   </div>
                </div>
                <div className={`flex flex-col items-center justify-center w-12 h-10 rounded border ${getMagColor(quake.properties.mag)}`}>
                    <span className="text-sm font-bold">{quake.properties.mag.toFixed(1)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
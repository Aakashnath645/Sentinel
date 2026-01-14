import React from 'react';
import { EarthquakeFeature, VolcanoFeature, SpaceWeather, LegendEvent } from '../types';
import { Activity, Radio, Clock, MapPin, Search, Database, BarChart3, Wifi, Waves, Navigation, AlertTriangle, Landmark, Skull, Beaker, Zap, Layers, Play, RotateCcw, Target, MousePointer2, ShieldAlert, Siren, Hammer, BookOpen, AlertOctagon, Flame, Mountain, Sun, Info } from 'lucide-react';
import { getMagColor, formatTimeAgo, formatEnergy, getTNTEquivalent, getEnergyJoules } from '../utils/formatting';

// --- PROPS INTERFACES ---

interface LiveFeedProps {
    earthquakes: EarthquakeFeature[];
    totalEvents: number;
    maxMag: number;
    searchQuery: string;
    onSearch: (q: string) => void;
    sortBy: 'time' | 'distance';
    setSortBy: (s: 'time' | 'distance') => void;
    userLocation: { lat: number; lng: number } | null;
    lastUpdated: Date;
    selectedId: string | null;
    onSelect: (id: string, feature: EarthquakeFeature) => void;
}

interface MagmaMonitorProps {
    volcanoes: VolcanoFeature[];
}

interface CosmicPanelProps {
    spaceWeather: SpaceWeather | null;
}

interface MuseumPanelProps {
    activeLegend: LegendEvent | null;
}

interface LabPanelProps {
    labTab: 'impact' | 'wave' | 'forecast';
    onLabTabChange: (t: 'impact' | 'wave' | 'forecast') => void;
    labState: { mag: number; depth: number; location: { lat: number; lng: number } | null };
    onLabStateChange: (s: any) => void;
    waveSim: any;
    waveStats: any;
    onWaveReset: () => void;
    onWaveStart: () => void;
    analyticsData: any;
    onSelect: (id: string, feature: EarthquakeFeature) => void;
}

interface ProtocolsPanelProps {
    protocolTab: 'preparedness' | 'response' | 'recovery';
    setProtocolTab: (t: 'preparedness' | 'response' | 'recovery') => void;
}

// --- COMPONENTS ---

export const LiveFeed: React.FC<LiveFeedProps> = ({ 
    earthquakes, totalEvents, maxMag, searchQuery, onSearch, sortBy, setSortBy, userLocation, lastUpdated, selectedId, onSelect 
}) => {
    return (
        <>
            <div className="flex-none px-6 py-6 border-b border-cyan-900/30 bg-slate-900/80 relative overflow-hidden">
                <div className="absolute inset-0 bg-scanline pointer-events-none opacity-30"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="md:hidden relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/50 bg-cyan-900/20">
                                <Radio className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-[0.2em] text-cyan-50 font-mono leading-none">SENTINEL</h1>
                                <p className="text-[10px] text-cyan-500 uppercase tracking-widest mt-1 font-semibold">Planetary Surveillance</p>
                            </div>
                        </div>
                        <div className="text-right pr-6 hidden sm:block">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <Wifi className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] text-emerald-500 font-mono tracking-widest">LIVE SENSORS</span>
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
                                placeholder="QUERY LOC OR MAG..."
                                className="block w-full pl-10 pr-3 py-2 border border-slate-800 bg-slate-950/80 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono uppercase tracking-wide transition-all"
                            />
                        </div>
                        {userLocation && (
                            <button
                                onClick={() => setSortBy(sortBy === 'time' ? 'distance' : 'time')}
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

                {earthquakes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm font-mono">
                        <p>NO SIGNAL DETECTED</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-800/40 relative z-10 pb-20 md:pb-0">
                    {earthquakes.map((quake) => {
                        // @ts-ignore - dynamic prop added in parent
                        const distanceToUser = quake.distanceToUser; 
                        const isLocalAlert = distanceToUser !== null && distanceToUser < 500;
                        const mag = quake.properties.mag || 0;
                        
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
                                    
                                    {distanceToUser !== null && (
                                        <span className={`text-[10px] flex items-center gap-1.5 font-mono ${isLocalAlert ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                                            <Navigation className="w-2.5 h-2.5" />
                                            {Math.round(distanceToUser).toLocaleString()} KM
                                        </span>
                                    )}

                                    <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                                        <Activity className="w-2.5 h-2.5" /> 
                                        {quake.geometry.coordinates[2]} KM
                                    </span>
                                </div>
                                </div>

                                <div className={`flex flex-col items-center justify-center w-10 h-10 border bg-slate-950/50 ${getMagColor(mag)}`}>
                                    <span className="text-sm font-bold font-mono">{mag.toFixed(1)}</span>
                                </div>
                            </div>
                            </li>
                        );
                    })}
                    </ul>
                )}
            </div>
        </>
    );
};

export const MagmaMonitor: React.FC<MagmaMonitorProps> = ({ volcanoes }) => (
    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn pb-20 md:pb-6">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Flame className="w-48 h-48 text-orange-500" />
        </div>
        
        <div className="relative z-10 space-y-6">
            <div>
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <Flame className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Magma Monitor</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono leading-tight">ACTIVE VOLCANOES</h2>
                <p className="text-xs text-orange-400/80 font-mono mt-2">Currently erupting or significant restless volcanoes.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-2">
                {volcanoes.length === 0 ? (
                    <div className="text-center p-4 text-slate-500 text-xs">Loading geological data...</div>
                ) : (
                    <div className="grid gap-3">
                        {volcanoes.map(v => (
                            <div key={v.id} className="bg-slate-950 border border-slate-800 hover:border-orange-500/50 p-3 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-950/30 border border-orange-500/30 flex items-center justify-center text-orange-500">
                                        <Mountain className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-orange-400 uppercase">{v.name}</h3>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {v.location}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-900/20 text-orange-400 border border-orange-500/20 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        {v.status}
                                    </div>
                                    <div className="text-[9px] text-slate-600 mt-1 font-mono">
                                        Elev: {v.elevation}m
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export const CosmicPanel: React.FC<CosmicPanelProps> = ({ spaceWeather }) => (
    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn pb-20 md:pb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sun className="w-48 h-48 text-blue-500" />
        </div>

        <div className="relative z-10 space-y-8">
                {/* Header */}
                <div>
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Sun className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Cosmic Weather Station</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono leading-tight">SOLAR & MAGNETIC</h2>
            </div>

            {!spaceWeather ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="text-blue-400 font-mono animate-pulse text-sm">ACQUIRING TELEMETRY...</span>
                    </div>
            ) : (
                <>
                    {/* Main Kp Display */}
                    <div className="bg-slate-900/80 border border-blue-900/50 p-6 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[9px] text-blue-400 font-mono">LIVE FEED</span>
                        </div>
                        
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Planetary K-index</span>
                        <div className="text-7xl font-bold font-mono text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            {(spaceWeather.kp || 0).toFixed(1)}
                        </div>
                        
                        <div className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-[0.2em] mb-4 ${
                            spaceWeather.status === 'Quiet' ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' :
                            spaceWeather.status === 'Unsettled' ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' :
                            'bg-red-950/50 border-red-500/50 text-red-500 animate-pulse'
                        }`}>
                            STATUS: {spaceWeather.status}
                        </div>
                    </div>

                    {/* Digital Gauge */}
                    <div className="bg-slate-900/50 border border-slate-800 p-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Geomagnetic Activity Monitor
                        </h4>
                        
                        <div className="flex justify-between items-end gap-1 h-32 px-2 pb-2 border-b border-slate-700">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                                const isActive = (spaceWeather.kp || 0) >= level;
                                // Colors: 1-3 Green, 4 Yellow, 5+ Red
                                let barColor = 'bg-slate-800';
                                let glow = '';
                                
                                if (isActive) {
                                    if (level < 4) { barColor = 'bg-emerald-500'; glow = 'shadow-[0_0_10px_rgba(16,185,129,0.5)]'; }
                                    else if (level < 5) { barColor = 'bg-yellow-500'; glow = 'shadow-[0_0_10px_rgba(234,179,8,0.5)]'; }
                                    else { barColor = 'bg-red-500'; glow = 'shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse'; }
                                }

                                return (
                                    <div key={level} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                        <div 
                                            className={`w-full rounded-sm transition-all duration-500 ${barColor} ${glow}`} 
                                            style={{ height: `${level * 10}%` }}
                                        ></div>
                                        <span className="text-[9px] text-slate-600 font-mono">{level}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-2 uppercase">
                            <span>Quiet</span>
                            <span>Unsettled</span>
                            <span>Storm</span>
                        </div>
                    </div>

                    {/* Info / Tooltip */}
                    <div className="bg-blue-950/20 border-l-2 border-blue-500/50 p-4 text-xs font-mono text-slate-400 leading-relaxed">
                        <strong className="text-blue-400 block mb-1">SYSTEM NOTE:</strong>
                        Monitoring solar wind interactions with Earth's magnetosphere. High Kp values (&gt;5) indicate geomagnetic storms capable of disrupting GPS, radio communications, and power grids.
                    </div>
                </>
            )}
        </div>
    </div>
);

export const MuseumPanel: React.FC<MuseumPanelProps> = ({ activeLegend }) => (
    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative pb-20 md:pb-6">
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
);

export const LabPanel: React.FC<LabPanelProps> = ({ 
    labTab, onLabTabChange, labState, onLabStateChange, waveSim, waveStats, onWaveReset, onWaveStart, analyticsData, onSelect 
}) => (
    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn pb-20 md:pb-6">
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
);

export const ProtocolsPanel: React.FC<ProtocolsPanelProps> = ({ protocolTab, setProtocolTab }) => (
    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 flex flex-col relative animate-fadeIn pb-20 md:pb-6">
    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <ShieldAlert className="w-48 h-48 text-green-500" />
    </div>
    
    <div className="relative z-10 space-y-6">
            <div>
            <div className="flex items-center gap-2 text-green-500 mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Emergency Directives</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono leading-tight">OFFICIAL SAFETY PROTOCOLS</h2>
            <div className="text-xs text-green-400/80 font-mono mt-2 flex items-center gap-2">
                    <span>SOURCE: UNDRR / UNITED NATIONS</span>
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span>REF: ISO 22320</span>
            </div>
        </div>

        <div className="flex border border-slate-800 rounded-lg p-1 bg-slate-900/50">
            <button
                onClick={() => setProtocolTab('preparedness')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                    protocolTab === 'preparedness' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <BookOpen className="w-3 h-3 inline mr-1" /> Mitigation
            </button>
            <button
                onClick={() => setProtocolTab('response')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                    protocolTab === 'response' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Siren className="w-3 h-3 inline mr-1" /> Response
            </button>
            <button
                onClick={() => setProtocolTab('recovery')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                    protocolTab === 'recovery' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Hammer className="w-3 h-3 inline mr-1" /> Recovery
            </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 font-mono relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-transparent to-green-500 opacity-50"></div>
            
            {protocolTab === 'preparedness' && (
                <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-green-400 font-bold uppercase text-sm border-b border-slate-700 pb-2 mb-4">Phase 1: Risk Reduction & Preparedness</h3>
                    
                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div className="flex gap-3">
                            <div className="text-green-500 font-bold">01</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Structural Assessment</strong>
                                Identify potential hazards in the home. Secure heavy furniture, appliances, and water heaters to wall studs. Inspect foundation for cracks.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-green-500 font-bold">02</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Emergency Supply Cache</strong>
                                Maintain a supply kit sufficient for 72 hours minimum. Include: Potable water (4L per person/day), non-perishable rations, first aid supplies, and battery-operated communication devices.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-green-500 font-bold">03</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Communication Plan</strong>
                                Establish an out-of-area contact. SMS is often more reliable than voice calls during network congestion. designate a meeting point.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {protocolTab === 'response' && (
                <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-red-400 font-bold uppercase text-sm border-b border-slate-700 pb-2 mb-4">Phase 2: Emergency Response</h3>
                    
                    <div className="p-4 bg-red-950/30 border border-red-500/30 mb-4 text-center">
                            <strong className="text-red-500 text-lg block mb-1">DROP, COVER, HOLD ON</strong>
                            <span className="text-red-200/80 text-xs">Standard International Protocol</span>
                    </div>

                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div className="flex gap-3">
                            <div className="text-red-500 font-bold">01</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Indoors</strong>
                                Do not run outside. Move away from windows, fireplaces, and heavy furniture. Take cover under a sturdy table.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-red-500 font-bold">02</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Outdoors</strong>
                                Move to a clear area away from buildings, trees, streetlights, and utility wires. Once in the open, stay there until shaking stops.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-red-500 font-bold">03</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Driving</strong>
                                Pull over to a clear location. Stop and stay inside with seatbelt fastened. Avoid bridges, overpasses, and power lines.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {protocolTab === 'recovery' && (
                <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-blue-400 font-bold uppercase text-sm border-b border-slate-700 pb-2 mb-4">Phase 3: Post-Event Assessment</h3>
                    
                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <div className="flex gap-3">
                            <div className="text-blue-500 font-bold">01</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Expect Aftershocks</strong>
                                Secondary shockwaves may follow the main event. These can cause further damage to weakened structures.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-blue-500 font-bold">02</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Utility Inspection</strong>
                                Check for gas leaks. If you smell gas or hear a blowing or hissing noise, open a window and quickly leave the building. Turn off the gas at the outside main valve if possible.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-blue-500 font-bold">03</div>
                            <div>
                                <strong className="block text-white mb-1 uppercase">Tsunami Awareness</strong>
                                If in a coastal zone, move to higher ground immediately if the shaking was strong enough to make standing difficult.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 uppercase">
                <span>UN Document ID: 88-2911-B</span>
                <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Official Guidance</span>
            </div>
        </div>
    </div>
    </div>
);

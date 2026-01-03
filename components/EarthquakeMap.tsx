import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, AttributionControl, GeoJSON } from 'react-leaflet';
import { EarthquakeFeature } from '../types';
import { fetchTectonicPlates } from '../services/usgs';
import { Activity, Radio, Cpu, Waves, ScanLine } from 'lucide-react';

interface MapProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  onAnalyze: (feature: EarthquakeFeature) => void;
}

// Fix for React Leaflet type issues where TypeScript definitions may be missing standard props
const MapContainerFixed = MapContainer as any;
const TileLayerFixed = TileLayer as any;
const GeoJSONFixed = GeoJSON as any;
const PopupFixed = Popup as any;

// Component to handle flying to location when selectedId changes
const MapController: React.FC<{ selectedId: string | null; earthquakes: EarthquakeFeature[] }> = ({ selectedId, earthquakes }) => {
  const map = useMap();

  useEffect(() => {
    // Force map invalidation on mount to ensure tiles load correctly if container resized
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (selectedId) {
      const quake = earthquakes.find(q => q.id === selectedId);
      if (quake) {
        // GeoJSON is Long, Lat. Leaflet is Lat, Long.
        map.flyTo([quake.geometry.coordinates[1], quake.geometry.coordinates[0]], 8, {
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [selectedId, earthquakes, map]);

  return null;
};

const EarthquakeMap: React.FC<MapProps> = ({ earthquakes, selectedId, onSelect, onAnalyze }) => {
  const [tectonicPlates, setTectonicPlates] = useState<any>(null);

  useEffect(() => {
      fetchTectonicPlates().then(data => {
          if (data) setTectonicPlates(data);
      });
  }, []);
  
  // Logic: Color now based on DEPTH
  // Shallow (<10km) = Red
  // Intermediate (10-70km) = Yellow
  // Deep (>70km) = Blue
  const getDepthColor = (depth: number) => {
    if (depth < 10) return '#ef4444'; // Red (Shallow/Dangerous)
    if (depth <= 70) return '#eab308'; // Yellow (Intermediate)
    return '#3b82f6'; // Blue (Deep)
  };

  const getRadius = (mag: number) => {
    return mag < 2 ? 4 : Math.max(mag * 3, 4); 
  };

  return (
    <div className="w-full h-full relative isolate">
        <MapContainerFixed
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        className="w-full h-full z-0 bg-black"
        style={{ height: '100%', width: '100%', background: '#020617' }}
        attributionControl={false} 
        worldCopyJump={true}
        >
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayerFixed
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Tectonic Plates Layer - Rendered before quakes to stay in background */}
        {tectonicPlates && (
            <GeoJSONFixed 
                data={tectonicPlates}
                style={{
                    color: '#22d3ee', // Cyan-400
                    weight: 1.5,
                    opacity: 0.3,
                    className: 'tectonic-line' // See index.html for glow filter
                }}
            />
        )}
        
        <MapController selectedId={selectedId} earthquakes={earthquakes} />

        {earthquakes.map((quake) => {
            const [lng, lat, depth] = quake.geometry.coordinates;
            const mag = quake.properties.mag;
            const isSelected = selectedId === quake.id;
            const isTsunami = quake.properties.tsunami === 1;
            
            const depthColor = getDepthColor(depth);
            const radius = getRadius(mag);

            return (
              <React.Fragment key={quake.id}>
                {/* Tsunami Pulse Effect Layer (Renders under the main marker) */}
                {isTsunami && (
                   <CircleMarker
                      center={[lat, lng]}
                      radius={radius}
                      className="tsunami-ring" // CSS animation defined in index.html
                      pathOptions={{
                        color: '#06b6d4', // Cyan pulse
                        fill: false,
                        weight: 2
                      }}
                      interactive={false} 
                   />
                )}

                {/* Main Data Marker */}
                <CircleMarker
                    center={[lat, lng]}
                    radius={radius}
                    className="quake-marker"
                    pathOptions={{
                        color: depthColor, // Stroke color (Depth)
                        fillColor: depthColor, // Fill color (Depth)
                        fillOpacity: isSelected ? 0.9 : 0.5,
                        weight: isSelected ? 2 : 1,
                    }}
                    eventHandlers={{
                        click: () => onSelect(quake.id, quake),
                        mouseover: (e) => {
                            const layer = e.target;
                            layer.setStyle({ fillOpacity: 1, weight: 3 });
                        },
                        mouseout: (e) => {
                            const layer = e.target;
                            layer.setStyle({ fillOpacity: isSelected ? 0.9 : 0.5, weight: isSelected ? 2 : 1 });
                        }
                    }}
                >
                    <PopupFixed className="custom-popup" closeButton={false} maxWidth={300}>
                    <div className="font-mono text-slate-200">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-cyan-900/50">
                            <h3 className="font-bold text-cyan-50 text-xs uppercase leading-snug tracking-wider">{quake.properties.place}</h3>
                        </div>
                        
                        {/* Tsunami Warning in Popup */}
                        {isTsunami && (
                            <div className="mb-3 bg-cyan-950/50 border border-cyan-500/50 p-2 flex items-center gap-2 animate-pulse">
                                <Waves className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest">Tsunami Warning</span>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="uppercase text-[9px] tracking-wider text-slate-500">Depth</span>
                                <div className="flex items-center gap-1.5" style={{ color: depthColor }}>
                                    <Activity className="w-3 h-3" />
                                    <span className="font-bold">{depth} KM</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="uppercase text-[9px] tracking-wider text-slate-500">Mag</span>
                                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                    <Radio className="w-3 h-3" />
                                    <span>{mag.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action - Analysis Button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onAnalyze(quake);
                            }}
                            className="w-full group flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-xs font-bold py-2.5 px-3 transition-all tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                            <ScanLine className="w-3 h-3 group-hover:animate-pulse" />
                            <span>Initiate AI Analysis</span>
                        </button>
                    </div>
                    </PopupFixed>
                </CircleMarker>
              </React.Fragment>
            );
        })}
        </MapContainerFixed>
    </div>
  );
};

export default EarthquakeMap;
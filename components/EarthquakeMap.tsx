import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, AttributionControl } from 'react-leaflet';
import { EarthquakeFeature } from '../types';
import { Activity, Radio, Cpu, Clock } from 'lucide-react';

interface MapProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  onAnalyze: (feature: EarthquakeFeature) => void;
}

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
  
  // Helper to determine the CSS class for the SVG path
  const getGlowClass = (mag: number) => {
    if (mag < 2.0) return 'quake-low';
    if (mag < 4.5) return 'quake-med';
    if (mag < 6.0) return 'quake-high';
    return 'quake-extreme';
  };

  const getColor = (mag: number) => {
    if (mag < 2.0) return '#10b981'; // emerald
    if (mag < 4.5) return '#eab308'; // yellow
    if (mag < 6.0) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getRadius = (mag: number) => {
    return mag < 2 ? 4 : Math.max(mag * 3, 4); 
  };

  return (
    <div className="w-full h-full relative isolate">
        <MapContainer
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        className="w-full h-full z-0 bg-black"
        style={{ height: '100%', width: '100%', background: '#020617' }}
        attributionControl={false} 
        worldCopyJump={true}
        >
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController selectedId={selectedId} earthquakes={earthquakes} />

        {earthquakes.map((quake) => {
            const [lng, lat, depth] = quake.geometry.coordinates;
            const mag = quake.properties.mag;
            const isSelected = selectedId === quake.id;

            return (
            <CircleMarker
                key={quake.id}
                center={[lat, lng]}
                radius={getRadius(mag)}
                // IMPORTANT: passing css class to the SVG path
                className={getGlowClass(mag)}
                pathOptions={{
                color: getColor(mag), // Stroke color
                fillColor: getColor(mag), // Fill color
                fillOpacity: isSelected ? 0.9 : 0.4, // Lower opacity to let glow shine
                weight: isSelected ? 2 : 1,
                }}
                eventHandlers={{
                click: () => onSelect(quake.id, quake),
                mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                    fillOpacity: 1,
                    weight: 3,
                    });
                },
                mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                    fillOpacity: isSelected ? 0.9 : 0.4,
                    weight: isSelected ? 2 : 1,
                    });
                }
                }}
            >
                <Popup className="custom-popup" closeButton={false}>
                <div className="min-w-[240px] font-mono">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-cyan-900/50">
                        <h3 className="font-bold text-cyan-50 text-xs uppercase leading-snug">{quake.properties.place}</h3>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-4">
                        <div className="flex flex-col gap-1">
                            <span className="uppercase text-[9px] tracking-wider text-slate-500">Depth</span>
                            <div className="flex items-center gap-1.5 text-cyan-300">
                                <Activity className="w-3 h-3" />
                                <span>{depth} KM</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="uppercase text-[9px] tracking-wider text-slate-500">Mag</span>
                            <div className="flex items-center gap-1.5 font-bold" style={{ color: getColor(mag) }}>
                                <Radio className="w-3 h-3" />
                                <span>{mag.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onAnalyze(quake);
                        }}
                        className="w-full group flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 text-xs font-bold py-2 px-3 transition-all tracking-wider uppercase"
                    >
                        <Cpu className="w-3 h-3 group-hover:animate-spin" />
                        <span>Initiate Analysis</span>
                    </button>
                </div>
                </Popup>
            </CircleMarker>
            );
        })}
        </MapContainer>
    </div>
  );
};

export default EarthquakeMap;
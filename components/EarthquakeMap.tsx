import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, AttributionControl } from 'react-leaflet';
import { EarthquakeFeature } from '../types';
import L from 'leaflet';
import { Activity, Radio, Cpu } from 'lucide-react';

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
  
  const getColor = (mag: number) => {
    if (mag < 2.0) return '#10b981'; // emerald-500
    if (mag < 4.5) return '#eab308'; // yellow-500
    if (mag < 6.0) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const getRadius = (mag: number) => {
    return mag < 2 ? 4 : Math.max(mag * 3, 4); 
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2.5}
      minZoom={2}
      className="w-full h-full z-0 bg-slate-900"
      attributionControl={false} // Custom one later if needed, or default
    >
      <AttributionControl position="bottomright" prefix={false} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapController selectedId={selectedId} earthquakes={earthquakes} />

      {earthquakes.map((quake) => {
        const [lng, lat, depth] = quake.geometry.coordinates;
        const mag = quake.properties.mag;
        const isSelected = selectedId === quake.id;
        const isMajor = mag >= 6.0;

        return (
          <CircleMarker
            key={quake.id}
            center={[lat, lng]}
            radius={getRadius(mag)}
            pathOptions={{
              color: getColor(mag),
              fillColor: getColor(mag),
              fillOpacity: isSelected ? 0.9 : 0.6,
              weight: isSelected ? 2 : 1,
            }}
            className={isMajor ? 'pulse-icon' : ''}
            eventHandlers={{
              click: () => onSelect(quake.id, quake),
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: 1,
                  weight: 3,
                });
                layer.setRadius(getRadius(mag) + 3);
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: isSelected ? 0.9 : 0.6,
                  weight: isSelected ? 2 : 1,
                });
                layer.setRadius(getRadius(mag));
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-slate-800 text-sm leading-tight">{quake.properties.place}</h3>
                   <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white`} style={{ backgroundColor: getColor(mag) }}>
                     {mag.toFixed(1)}
                   </span>
                </div>
                
                <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>Depth: {depth} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        <span>{new Date(quake.properties.time).toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onAnalyze(quake);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold py-1.5 px-2 rounded transition-colors"
                >
                    <Cpu className="w-3 h-3" />
                    <span>ANALYZE EVENT</span>
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default EarthquakeMap;
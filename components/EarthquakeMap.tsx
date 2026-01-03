import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, AttributionControl, GeoJSON, useMapEvents, Marker } from 'react-leaflet';
import { EarthquakeFeature, LegendEvent } from '../types';
import { fetchTectonicPlates } from '../services/usgs';
import { Activity, Radio, Waves, ScanLine, Beaker, MapPin } from 'lucide-react';
import L from 'leaflet';

interface MapProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  onAnalyze: (feature: EarthquakeFeature) => void;
  viewMode: 'live' | 'museum' | 'lab';
  activeLegend: LegendEvent | null;
  labState: { mag: number; depth: number };
  labTab: 'impact' | 'wave';
  waveSim: {
      station: { lat: number; lng: number } | null;
      epicenter: { lat: number; lng: number } | null;
      pRadius: number;
      sRadius: number;
  };
  onMapClick: (latlng: {lat: number, lng: number}) => void;
}

// Fix for React Leaflet type issues
const MapContainerFixed = MapContainer as any;
const TileLayerFixed = TileLayer as any;
const GeoJSONFixed = GeoJSON as any;
const PopupFixed = Popup as any;

// Custom Icons for Lab Mode
const createLabIcon = (color: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const stationIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border: 2px solid white; border-radius: 2px; box-shadow: 0 0 10px #3b82f6;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const epicenterIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #ef4444;" class="animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});


// --- GEOMETRY UTILS ---
const shiftGeoJSON = (data: any) => {
    if (!data || !data.features) return data;
    const newFeatures: any[] = [];
    data.features.forEach((feature: any) => {
        newFeatures.push(feature);
        const right = JSON.parse(JSON.stringify(feature));
        shiftCoords(right.geometry, 360);
        newFeatures.push(right);
        const left = JSON.parse(JSON.stringify(feature));
        shiftCoords(left.geometry, -360);
        newFeatures.push(left);
    });
    return { ...data, features: newFeatures };
};

const shiftCoords = (geometry: any, offset: number) => {
    if (geometry.type === 'LineString') {
        geometry.coordinates.forEach((coord: any) => coord[0] += offset);
    } else if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach((line: any) => line.forEach((coord: any) => coord[0] += offset));
    }
};

// --- SUB-COMPONENTS ---

const MapResizer: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, [map]);
    return null;
};

// Handle clicks on the map surface
const MapClickHandler: React.FC<{ onMapClick: (latlng: {lat: number, lng: number}) => void }> = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        }
    });
    return null;
};

// Controller handles flying to locations (Live, Museum, or Lab)
const MapController: React.FC<{ 
    selectedId: string | null; 
    earthquakes: EarthquakeFeature[];
    viewMode: 'live' | 'museum' | 'lab';
    activeLegend: LegendEvent | null;
}> = ({ selectedId, earthquakes, viewMode, activeLegend }) => {
  const map = useMap();

  useEffect(() => {
    if (viewMode === 'live' && selectedId) {
      const quake = earthquakes.find(q => q.id === selectedId);
      if (quake) {
        map.flyTo([quake.geometry.coordinates[1], quake.geometry.coordinates[0]], 8, {
          animate: true,
          duration: 1.5
        });
      }
    } else if (viewMode === 'museum' && activeLegend) {
        map.flyTo(activeLegend.coords, 5, {
            animate: true,
            duration: 2
        });
    } else if (viewMode === 'lab') {
        // Just ensure reasonable zoom, don't force move every time unless necessary
        // map.flyTo([0, -160], 5, { animate: true, duration: 2 });
    }
  }, [selectedId, earthquakes, map, viewMode, activeLegend]);

  return null;
};

const EarthquakeMap: React.FC<MapProps> = ({ 
    earthquakes, selectedId, onSelect, onAnalyze, viewMode, activeLegend, labState, labTab, waveSim, onMapClick 
}) => {
  const [tectonicPlates, setTectonicPlates] = useState<any>(null);
  
  // Lab Test Site Coordinates (Middle of Pacific)
  const LAB_IMPACT_COORDS: [number, number] = [0, -160];

  useEffect(() => {
      fetchTectonicPlates().then(data => {
          if (data) {
              const processed = shiftGeoJSON(data);
              setTectonicPlates(processed);
          }
      });
  }, []);
  
  const getDepthColor = (depth: number) => {
    if (depth < 10) return '#ef4444'; 
    if (depth <= 70) return '#eab308'; 
    return '#3b82f6';
  };

  const getRadius = (mag: number) => {
    return mag < 2 ? 4 : Math.max(mag * 3, 4); 
  };
  
  // Impact Sim Logic
  const getLabImpactRadius = (mag: number, depth: number) => {
      const baseRadiusKm = Math.pow(10, (0.55 * mag - 1.2)); 
      const attenuation = 1 - (depth / 1000); 
      return baseRadiusKm * Math.max(attenuation, 0.1) * 1000; 
  };

  return (
    <div className="w-full h-full relative isolate">
        <MapContainerFixed
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        className="w-full h-full z-0 bg-black"
        style={{ height: '100%', width: '100%', background: '#020617', cursor: viewMode === 'lab' && labTab === 'wave' ? 'crosshair' : 'grab' }}
        attributionControl={false} 
        worldCopyJump={true}
        maxBounds={[[-90, -Infinity], [90, Infinity]]}
        maxBoundsViscosity={1.0}
        >
        <MapResizer />
        <MapClickHandler onMapClick={onMapClick} />
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayerFixed
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {tectonicPlates && (
            <GeoJSONFixed 
                data={tectonicPlates}
                style={{
                    color: '#22d3ee', 
                    weight: 1.5,
                    opacity: 0.3,
                    className: 'tectonic-line'
                }}
            />
        )}
        
        <MapController 
            selectedId={selectedId} 
            earthquakes={earthquakes} 
            viewMode={viewMode}
            activeLegend={activeLegend}
        />

        {/* LIVE MODE MARKERS */}
        {viewMode === 'live' && earthquakes.map((quake) => {
            const [lng, lat, depth] = quake.geometry.coordinates;
            const mag = quake.properties.mag;
            const isSelected = selectedId === quake.id;
            const isTsunami = quake.properties.tsunami === 1;
            
            const depthColor = getDepthColor(depth);
            const radius = getRadius(mag);

            return (
              <React.Fragment key={quake.id}>
                {isTsunami && (
                   <CircleMarker
                      center={[lat, lng]}
                      radius={radius}
                      className="tsunami-ring"
                      pathOptions={{ color: '#06b6d4', fill: false, weight: 2 }}
                      interactive={false} 
                   />
                )}

                <CircleMarker
                    center={[lat, lng]}
                    radius={radius}
                    className="quake-marker"
                    pathOptions={{
                        color: depthColor,
                        fillColor: depthColor,
                        fillOpacity: isSelected ? 0.9 : 0.5,
                        weight: isSelected ? 2 : 1,
                    }}
                    eventHandlers={{
                        click: () => onSelect(quake.id, quake),
                        mouseover: (e) => { e.target.setStyle({ fillOpacity: 1, weight: 3 }); },
                        mouseout: (e) => { e.target.setStyle({ fillOpacity: isSelected ? 0.9 : 0.5, weight: isSelected ? 2 : 1 }); }
                    }}
                >
                    <PopupFixed className="custom-popup" closeButton={false} maxWidth={300}>
                    <div className="font-mono text-slate-200">
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-cyan-900/50">
                            <h3 className="font-bold text-cyan-50 text-xs uppercase leading-snug tracking-wider">{quake.properties.place}</h3>
                        </div>
                        {isTsunami && (
                            <div className="mb-3 bg-cyan-950/50 border border-cyan-500/50 p-2 flex items-center gap-2 animate-pulse">
                                <Waves className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest">Tsunami Warning</span>
                            </div>
                        )}
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

        {/* MUSEUM MODE MARKER */}
        {viewMode === 'museum' && activeLegend && (
            <React.Fragment>
                <Circle 
                    center={activeLegend.coords}
                    radius={activeLegend.impactRadiusKm * 1000} 
                    pathOptions={{
                        color: '#ef4444',
                        weight: 1,
                        fillColor: '#ef4444',
                        fillOpacity: 0.2,
                        dashArray: '5, 5'
                    }}
                />
                <CircleMarker
                    center={activeLegend.coords}
                    radius={15}
                    pathOptions={{
                        color: '#ffffff',
                        weight: 3,
                        fillColor: '#ef4444',
                        fillOpacity: 1
                    }}
                >
                     <PopupFixed className="custom-popup" closeButton={false} maxWidth={300}>
                         <div className="font-mono text-slate-200">
                            <h3 className="font-bold text-red-500 text-sm uppercase mb-1">{activeLegend.year} EPICENTER</h3>
                            <div className="text-xs text-slate-300">{activeLegend.place}</div>
                         </div>
                     </PopupFixed>
                </CircleMarker>
            </React.Fragment>
        )}
        
        {/* LAB: IMPACT SIMULATION */}
        {viewMode === 'lab' && labTab === 'impact' && (
            <React.Fragment>
                <Circle 
                    center={LAB_IMPACT_COORDS}
                    radius={getLabImpactRadius(labState.mag, labState.depth)} 
                    pathOptions={{
                        color: '#a855f7', 
                        weight: 1,
                        fillColor: '#a855f7',
                        fillOpacity: 0.2,
                        dashArray: '10, 5',
                        className: 'animate-pulse'
                    }}
                />
                <CircleMarker
                    center={LAB_IMPACT_COORDS}
                    radius={10}
                    pathOptions={{
                        color: '#fff',
                        weight: 2,
                        fillColor: '#a855f7',
                        fillOpacity: 0.8
                    }}
                >
                     <PopupFixed className="custom-popup" closeButton={false} maxWidth={300} autoPan={false}>
                         <div className="font-mono text-slate-200">
                            <div className="flex items-center gap-2 mb-2 text-purple-400">
                                <Beaker className="w-4 h-4" />
                                <h3 className="font-bold text-sm uppercase">SIMULATION SITE</h3>
                            </div>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Magnitude:</span>
                                    <span className="font-bold text-purple-300">{labState.mag.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Depth:</span>
                                    <span className="font-bold text-blue-300">{labState.depth} km</span>
                                </div>
                            </div>
                         </div>
                     </PopupFixed>
                </CircleMarker>
                <CircleMarker
                    center={LAB_IMPACT_COORDS}
                    radius={30}
                    pathOptions={{ color: '#a855f7', weight: 1, fill: false, dashArray: '2, 4' }}
                    interactive={false}
                />
            </React.Fragment>
        )}

        {/* LAB: WAVE SIMULATION */}
        {viewMode === 'lab' && labTab === 'wave' && (
            <React.Fragment>
                {/* Station */}
                {waveSim.station && (
                     <Marker position={waveSim.station} icon={stationIcon}>
                         <PopupFixed className="custom-popup" closeButton={false} offset={[0, -10]}>
                             <div className="font-mono text-blue-400 font-bold text-xs">SEISMOMETER STATION</div>
                         </PopupFixed>
                     </Marker>
                )}

                {/* Epicenter */}
                {waveSim.epicenter && (
                     <Marker position={waveSim.epicenter} icon={epicenterIcon}>
                         <PopupFixed className="custom-popup" closeButton={false} offset={[0, -10]}>
                             <div className="font-mono text-red-400 font-bold text-xs">TEST EPICENTER</div>
                         </PopupFixed>
                     </Marker>
                )}

                {/* Waves */}
                {waveSim.epicenter && waveSim.pRadius > 0 && (
                    <Circle 
                        center={waveSim.epicenter}
                        radius={waveSim.pRadius * 1000} // km to m
                        pathOptions={{ color: '#facc15', weight: 2, fill: false, opacity: 0.8 }}
                    />
                )}
                {waveSim.epicenter && waveSim.sRadius > 0 && (
                    <Circle 
                        center={waveSim.epicenter}
                        radius={waveSim.sRadius * 1000} // km to m
                        pathOptions={{ color: '#ef4444', weight: 4, fill: false, opacity: 0.8 }}
                    />
                )}
            </React.Fragment>
        )}

        </MapContainerFixed>
    </div>
  );
};

export default EarthquakeMap;
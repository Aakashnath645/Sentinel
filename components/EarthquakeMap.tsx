import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, AttributionControl, GeoJSON, useMapEvents, Marker, Polyline } from 'react-leaflet';
import { EarthquakeFeature, LegendEvent, VolcanoFeature, ISSPosition } from '../types';
import { fetchTectonicPlates } from '../services/usgs';
import { Activity, Radio, Waves, ScanLine, Beaker, Flame, Satellite } from 'lucide-react';
import { getMagColor } from '../utils/formatting';
import L from 'leaflet';

interface MapProps {
  earthquakes: EarthquakeFeature[];
  volcanoes: VolcanoFeature[];
  selectedId: string | null;
  onSelect: (id: string, feature: EarthquakeFeature) => void;
  onAnalyze: (feature: EarthquakeFeature) => void;
  viewMode: 'live' | 'museum' | 'lab' | 'protocols' | 'magma' | 'cosmic';
  activeLegend: LegendEvent | null;
  labState: { mag: number; depth: number; location: { lat: number; lng: number } | null };
  labTab: 'impact' | 'wave' | 'forecast';
  waveSim: {
      station: { lat: number; lng: number } | null;
      epicenter: { lat: number; lng: number } | null;
      pRadius: number;
      sRadius: number;
  };
  onMapClick: (latlng: {lat: number, lng: number}) => void;
  isIdle: boolean;
  patrolTarget: EarthquakeFeature | null;
  issPosition: ISSPosition | null;
  issPath: [number, number][];
}

// Custom Icons
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

const groundZeroIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #a855f7; width: 16px; height: 16px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #a855f7;" class="animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const volcanoIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="volcano-icon-marker" style="width: 14px; height: 14px; border: 2px solid white; border-radius: 50%;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const issIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(2, 6, 23, 0.7); border: 1px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(255,255,255,0.4);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 5H19V11" />
                <path d="M19 5L5 19" />
                <path d="M11 19H5V13" />
            </svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});


// --- GEOMETRY UTILS ---
const shiftGeoJSON = (data: any) => {
    if (!data || !data.features) return data;
    const newFeatures: any[] = [];
    data.features.forEach((feature: any) => {
        newFeatures.push(feature);
        const right = structuredClone(feature);
        shiftCoords(right.geometry, 360);
        newFeatures.push(right);
        const left = structuredClone(feature);
        shiftCoords(left.geometry, -360);
        newFeatures.push(left);
    });
    return { ...data, features: newFeatures };
};

const shiftCoords = (geometry: any, offset: number) => {
    if (geometry.type === 'LineString') {
        geometry.coordinates.forEach((coord: any) => {
            if (Array.isArray(coord) && typeof coord[0] === 'number') {
                coord[0] += offset;
            }
        });
    } else if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach((line: any) => {
            if (Array.isArray(line)) {
                line.forEach((coord: any) => {
                    if (Array.isArray(coord) && typeof coord[0] === 'number') {
                        coord[0] += offset;
                    }
                });
            }
        });
    }
};

// Robust check for valid coordinates
const isValidLatLng = (lat: any, lng: any) => {
    return (
        typeof lat === 'number' && 
        typeof lng === 'number' && 
        !isNaN(lat) && 
        !isNaN(lng) && 
        isFinite(lat) && 
        isFinite(lng)
    );
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
            if (isValidLatLng(e.latlng.lat, e.latlng.lng)) {
                onMapClick(e.latlng);
            }
        }
    });
    return null;
};

const MapController: React.FC<{ 
    selectedId: string | null; 
    earthquakes: EarthquakeFeature[];
    viewMode: 'live' | 'museum' | 'lab' | 'protocols' | 'magma' | 'cosmic';
    activeLegend: LegendEvent | null;
    isIdle: boolean;
    volcanoes: VolcanoFeature[];
    patrolTarget: EarthquakeFeature | null;
}> = ({ selectedId, earthquakes, viewMode, activeLegend, isIdle, volcanoes, patrolTarget }) => {
  const map = useMap();

  useEffect(() => {
    try {
        // 1. Screensaver Patrol Mode (Highest Priority)
        if (isIdle && patrolTarget && patrolTarget.geometry && patrolTarget.geometry.coordinates) {
             const lat = patrolTarget.geometry.coordinates[1];
             const lng = patrolTarget.geometry.coordinates[0];
             
             if (isValidLatLng(lat, lng)) {
                 map.flyTo([lat, lng], 5, {
                     animate: true,
                     duration: 8,
                     easeLinearity: 0.1
                 });
             }
             return; 
        }
    
        // 2. Live Mode Selection
        if (viewMode === 'live' && selectedId) {
          const quake = earthquakes.find(q => q.id === selectedId);
          if (quake && quake.geometry && quake.geometry.coordinates) {
            const lat = quake.geometry.coordinates[1];
            const lng = quake.geometry.coordinates[0];
            if (isValidLatLng(lat, lng)) {
                map.flyTo([lat, lng], 8, {
                  animate: true,
                  duration: 1.5
                });
            }
          }
        } 
        // 3. Museum Mode Legend
        else if (viewMode === 'museum' && activeLegend && activeLegend.coords) {
            const [lat, lng] = activeLegend.coords;
            if (isValidLatLng(lat, lng)) {
                map.flyTo([lat, lng], 5, {
                    animate: true,
                    duration: 2
                });
            }
        } 
        // 4. Global Views (Protocols, Magma, Cosmic)
        else if (viewMode === 'protocols' || viewMode === 'magma' || viewMode === 'cosmic') {
             map.flyTo([20, 0], 2.5, { animate: true, duration: 1.5 });
        }
    } catch (e) {
        console.warn("MapController FlyTo Error", e);
    }
  }, [selectedId, earthquakes, map, viewMode, activeLegend, isIdle, patrolTarget]);

  return null;
};

// Component to render a quake marker + its ghosts for seamless wrapping
interface WrappedQuakeMarkerProps {
    quake: EarthquakeFeature;
    selectedId: string | null;
    onSelect: (id: string, feature: EarthquakeFeature) => void;
    onAnalyze: (feature: EarthquakeFeature) => void;
    isIdle: boolean;
    patrolTarget: EarthquakeFeature | null;
}

const WrappedQuakeMarker: React.FC<WrappedQuakeMarkerProps> = ({ 
    quake, 
    selectedId, 
    onSelect, 
    onAnalyze, 
    isIdle, 
    patrolTarget 
}) => {
    // Coordinate safety check before destructuring/rendering
    if (!quake.geometry || !quake.geometry.coordinates || quake.geometry.coordinates.length < 2) return null;
    
    const [lng, lat, depth] = quake.geometry.coordinates;

    if (!isValidLatLng(lat, lng)) return null;

    const mag = quake.properties.mag || 0;
    const isSelected = selectedId === quake.id;
    const isTsunami = quake.properties.tsunami === 1;
    const isPatrolTarget = isIdle && patrolTarget?.id === quake.id;
    
    const depthColor = depth < 10 ? '#ef4444' : depth <= 70 ? '#eab308' : '#3b82f6';
    const radius = mag < 2 ? 4 : Math.max(mag * 3, 4); 

    // Render original, +360, and -360 variants
    const offsets = [0, 360, -360];

    return (
        <>
            {offsets.map((offset) => (
                <React.Fragment key={`${quake.id}-${offset}`}>
                    {isTsunami && (
                    <CircleMarker center={[lat, lng + offset]} radius={radius} className="tsunami-ring" pathOptions={{ color: '#06b6d4', fill: false, weight: 2 }} interactive={false} />
                    )}

                    <CircleMarker
                        center={[lat, lng + offset]}
                        radius={radius}
                        className="quake-marker"
                        pathOptions={{
                            color: isPatrolTarget ? '#ffffff' : depthColor, 
                            fillColor: depthColor,
                            fillOpacity: isSelected || isPatrolTarget ? 0.9 : 0.5,
                            weight: isSelected || isPatrolTarget ? 3 : 1,
                        }}
                        eventHandlers={{
                            click: () => onSelect(quake.id, quake),
                            mouseover: (e) => { e.target.setStyle({ fillOpacity: 1, weight: 3 }); },
                            mouseout: (e) => { e.target.setStyle({ fillOpacity: isSelected ? 0.9 : 0.5, weight: isSelected ? 2 : 1 }); }
                        }}
                    >
                        {/* Only show Popup on the main marker to avoid duplicate popup issues/clutter, or show on all if needed. For performance, strictly showing on 0 offset is better, but user might click ghost. */}
                        {(!isIdle) && ( 
                            <Popup className="custom-popup" closeButton={false} maxWidth={300}>
                            <div className="font-mono text-slate-200">
                                <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-cyan-900/50">
                                    <h3 className="font-bold text-cyan-50 text-xs uppercase leading-snug tracking-wider">{quake.properties.place}</h3>
                                </div>
                                {isTsunami && (
                                    <div className="mb-3 bg-cyan-950/80 border border-cyan-400 p-2 flex items-center justify-center gap-2 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                        <Waves className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-bold text-cyan-50 uppercase tracking-widest">TSUNAMI WARNING</span>
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
                            </Popup>
                        )}
                    </CircleMarker>
                </React.Fragment>
            ))}
        </>
    );
};

const EarthquakeMap: React.FC<MapProps> = ({ 
    earthquakes, volcanoes, selectedId, onSelect, onAnalyze, viewMode, activeLegend, labState, labTab, waveSim, onMapClick, isIdle, patrolTarget, issPosition, issPath
}) => {
  const [tectonicPlates, setTectonicPlates] = useState<any>(null);
  
  useEffect(() => {
      fetchTectonicPlates().then(data => {
          if (data) {
              const processed = shiftGeoJSON(data);
              setTectonicPlates(processed);
          }
      });
  }, []);
  
  const getLabImpactRadius = (mag: number, depth: number) => {
      const baseRadiusKm = Math.pow(10, (0.55 * mag - 1.2)); 
      const attenuation = 1 - (depth / 1000); 
      return baseRadiusKm * Math.max(attenuation, 0.1) * 1000; 
  };

  return (
    <div className="w-full h-full relative isolate">
        <MapContainer
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        className="w-full h-full z-0 bg-black"
        style={{ height: '100%', width: '100%', background: '#020617', cursor: viewMode === 'lab' && (labTab === 'wave' || labTab === 'impact') ? 'crosshair' : 'grab' }}
        attributionControl={false} 
        worldCopyJump={true}
        maxBounds={[[-90, -Infinity], [90, Infinity]]}
        maxBoundsViscosity={1.0}
        zoomControl={!isIdle} 
        >
        <MapResizer />
        <MapClickHandler onMapClick={onMapClick} />
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {tectonicPlates && (
            <GeoJSON
                data={tectonicPlates}
                style={{ color: '#22d3ee', weight: 1.5, opacity: 0.3, className: 'tectonic-line' }}
            />
        )}
        
        <MapController 
            selectedId={selectedId} 
            earthquakes={earthquakes} 
            viewMode={viewMode}
            activeLegend={activeLegend}
            isIdle={isIdle}
            volcanoes={volcanoes}
            patrolTarget={patrolTarget}
        />

        {issPosition && isValidLatLng(issPosition.latitude, issPosition.longitude) && (
            <React.Fragment>
                <Marker position={[issPosition.latitude, issPosition.longitude]} icon={issIcon} zIndexOffset={1000}>
                    {!isIdle && (
                        <Popup className="custom-popup" closeButton={false} maxWidth={300} autoPan={false}>
                             <div className="font-mono text-slate-200">
                                <div className="flex items-center gap-2 mb-2 text-white">
                                    <Satellite className="w-4 h-4" />
                                    <h3 className="font-bold text-sm uppercase">ISS ORBITAL ASSET</h3>
                                </div>
                                <div className="text-xs space-y-1 text-slate-300">
                                    <div className="flex justify-between border-b border-slate-700 pb-1">
                                        <span className="uppercase text-[9px] tracking-wider text-slate-500">Altitude</span>
                                        <span className="font-bold">{(issPosition.altitude || 0).toFixed(1)} km</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-700 pb-1">
                                        <span className="uppercase text-[9px] tracking-wider text-slate-500">Velocity</span>
                                        <span className="font-bold">{(issPosition.velocity || 0).toFixed(0)} km/h</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="uppercase text-[9px] tracking-wider text-slate-500">Visibility</span>
                                        <span className="font-bold text-cyan-400">{issPosition.visibility}</span>
                                    </div>
                                </div>
                             </div>
                        </Popup>
                    )}
                </Marker>
                <Polyline
                    positions={issPath.filter(p => isValidLatLng(p[0], p[1]))} 
                    pathOptions={{ color: 'white', weight: 1, opacity: 0.4, dashArray: '4, 8' }} 
                />
            </React.Fragment>
        )}

        {(viewMode === 'live' || isIdle) && earthquakes.map((quake) => (
            <WrappedQuakeMarker 
                key={quake.id}
                quake={quake}
                selectedId={selectedId}
                onSelect={onSelect}
                onAnalyze={onAnalyze}
                isIdle={isIdle}
                patrolTarget={patrolTarget}
            />
        ))}

        {viewMode === 'magma' && !isIdle && volcanoes.map((volcano) => {
             if (!volcano.coordinates || volcano.coordinates.length !== 2 || !isValidLatLng(volcano.coordinates[0], volcano.coordinates[1])) return null;

             return (
             <Marker key={volcano.id} position={volcano.coordinates} icon={volcanoIcon}>
                {!isIdle && (
                    <Popup className="custom-popup" closeButton={false} maxWidth={300}>
                        <div className="font-mono text-slate-200">
                            <div className="flex items-center gap-2 mb-2 text-orange-500">
                                <Flame className="w-4 h-4" />
                                <h3 className="font-bold text-sm uppercase">{volcano.name}</h3>
                            </div>
                            <div className="text-xs text-slate-400 space-y-2">
                                <div className="flex justify-between border-b border-orange-900/30 pb-1">
                                    <span className="uppercase tracking-widest text-[9px]">Location</span>
                                    <span className="text-slate-300">{volcano.location}</span>
                                </div>
                                <div className="flex justify-between border-b border-orange-900/30 pb-1">
                                    <span className="uppercase tracking-widest text-[9px]">Status</span>
                                    <span className="text-orange-400 font-bold animate-pulse">{volcano.status}</span>
                                </div>
                                <div className="flex justify-between border-b border-orange-900/30 pb-1">
                                    <span className="uppercase tracking-widest text-[9px]">Activity</span>
                                    <span className="text-slate-300">{volcano.lastEruption}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="uppercase tracking-widest text-[9px]">Type</span>
                                    <span className="text-slate-300">{volcano.type}</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
             </Marker>
             );
        })}

        {viewMode === 'museum' && !isIdle && activeLegend && activeLegend.coords && isValidLatLng(activeLegend.coords[0], activeLegend.coords[1]) && (
            <React.Fragment>
                <Circle 
                    center={activeLegend.coords}
                    radius={activeLegend.impactRadiusKm * 1000} 
                    pathOptions={{ color: '#ef4444', weight: 1, fillColor: '#ef4444', fillOpacity: 0.2, dashArray: '5, 5' }}
                />
                <CircleMarker
                    center={activeLegend.coords}
                    radius={15}
                    pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#ef4444', fillOpacity: 1 }}
                >
                     {!isIdle && (
                        <Popup className="custom-popup" closeButton={false} maxWidth={300}>
                            <div className="font-mono text-slate-200">
                                <h3 className="font-bold text-red-500 text-sm uppercase mb-1">{activeLegend.year} EPICENTER</h3>
                                <div className="text-xs text-slate-300">{activeLegend.place}</div>
                            </div>
                        </Popup>
                     )}
                </CircleMarker>
            </React.Fragment>
        )}
        
        {viewMode === 'lab' && !isIdle && labTab === 'impact' && labState.location && isValidLatLng(labState.location.lat, labState.location.lng) && (
            <React.Fragment>
                <Marker position={labState.location} icon={groundZeroIcon} />
                <Circle 
                    center={labState.location}
                    radius={getLabImpactRadius(labState.mag, labState.depth)} 
                    pathOptions={{ color: '#a855f7', weight: 1, fillColor: '#a855f7', fillOpacity: 0.2, dashArray: '10, 5', className: 'animate-pulse' }}
                />
                <CircleMarker center={labState.location} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: '#a855f7', fillOpacity: 0.8 }}>
                     {!isIdle && (
                         <Popup className="custom-popup" closeButton={false} maxWidth={300} autoPan={false}>
                             <div className="font-mono text-slate-200">
                                <div className="flex items-center gap-2 mb-2 text-purple-400">
                                    <Beaker className="w-4 h-4" />
                                    <h3 className="font-bold text-sm uppercase">SIMULATION SITE</h3>
                                </div>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Magnitude:</span>
                                        <span className="font-bold text-purple-300">{(labState.mag || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Depth:</span>
                                        <span className="font-bold text-blue-300">{labState.depth} km</span>
                                    </div>
                                </div>
                             </div>
                         </Popup>
                     )}
                </CircleMarker>
            </React.Fragment>
        )}

        {viewMode === 'lab' && !isIdle && labTab === 'wave' && (
            <React.Fragment>
                {waveSim.station && isValidLatLng(waveSim.station.lat, waveSim.station.lng) && (
                     <Marker position={waveSim.station} icon={stationIcon}>
                         {!isIdle && <Popup className="custom-popup" closeButton={false} offset={[0, -10]}><div className="font-mono text-blue-400 font-bold text-xs">SEISMOMETER STATION</div></Popup>}
                     </Marker>
                )}
                {waveSim.epicenter && isValidLatLng(waveSim.epicenter.lat, waveSim.epicenter.lng) && (
                     <Marker position={waveSim.epicenter} icon={epicenterIcon}>
                         {!isIdle && <Popup className="custom-popup" closeButton={false} offset={[0, -10]}><div className="font-mono text-red-400 font-bold text-xs">TEST EPICENTER</div></Popup>}
                     </Marker>
                )}
                {waveSim.epicenter && isValidLatLng(waveSim.epicenter.lat, waveSim.epicenter.lng) && waveSim.pRadius > 0 && !isNaN(waveSim.pRadius) && (
                    <Circle center={waveSim.epicenter} radius={waveSim.pRadius * 1000} pathOptions={{ color: '#facc15', weight: 2, fill: false, opacity: 0.8 }} />
                )}
                {waveSim.epicenter && isValidLatLng(waveSim.epicenter.lat, waveSim.epicenter.lng) && waveSim.sRadius > 0 && !isNaN(waveSim.sRadius) && (
                    <Circle center={waveSim.epicenter} radius={waveSim.sRadius * 1000} pathOptions={{ color: '#ef4444', weight: 4, fill: false, opacity: 0.8 }} />
                )}
            </React.Fragment>
        )}

        </MapContainer>
    </div>
  );
};

export default React.memo(EarthquakeMap);
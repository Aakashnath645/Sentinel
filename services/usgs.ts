import { USGSGeoJSON } from '../types';

const USGS_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const TECTONIC_PLATES_URL = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

export const fetchEarthquakes = async (): Promise<USGSGeoJSON> => {
  try {
    // Add a timestamp to prevent aggressive browser caching
    const response = await fetch(`${USGS_FEED_URL}?t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Status: ${response.status} ${response.statusText}`);
    }
    const data: USGSGeoJSON = await response.json();
    return data;
  } catch (error) {
    console.error("USGS Fetch Error:", error);
    throw error;
  }
};

export const fetchTectonicPlates = async (): Promise<any> => {
    try {
        const response = await fetch(TECTONIC_PLATES_URL);
        if (!response.ok) throw new Error('Failed to fetch tectonic plates');
        return await response.json();
    } catch (error) {
        console.error("Tectonic Plate Fetch Error:", error);
        return null;
    }
};
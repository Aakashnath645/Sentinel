import { USGSGeoJSON } from '../types';

const USGS_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

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
import { USGSGeoJSON } from '../types';

const USGS_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

export const fetchEarthquakes = async (): Promise<USGSGeoJSON> => {
  try {
    const response = await fetch(USGS_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch USGS data: ${response.statusText}`);
    }
    const data: USGSGeoJSON = await response.json();
    return data;
  } catch (error) {
    console.error("USGS Fetch Error:", error);
    throw error;
  }
};
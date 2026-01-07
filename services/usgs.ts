import { USGSGeoJSON, VolcanoFeature } from '../types';

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
    
    // SANITIZE DATA: Filter invalid entries and ensure numbers are numbers
    data.features = data.features
        .filter(f => f.geometry && f.geometry.coordinates && f.properties)
        .map(f => {
            // Ensure mag is a number, default to 0 if null
            const safeMag = (typeof f.properties.mag === 'number') ? f.properties.mag : 0;
            
            // Ensure coordinates exist
            const safeCoords = [
                f.geometry.coordinates[0] || 0,
                f.geometry.coordinates[1] || 0,
                f.geometry.coordinates[2] || 0
            ] as [number, number, number];

            return {
                ...f,
                properties: {
                    ...f.properties,
                    mag: safeMag,
                    place: f.properties.place || 'Unknown Location'
                },
                geometry: {
                    ...f.geometry,
                    coordinates: safeCoords
                }
            };
        });

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

// Providing a robust list of active volcanoes for the 'Magma Monitor'
// Real-time APIs for volcanoes are scarce or require paid access, so this
// curated list represents significant ongoing activity.
export const fetchVolcanoes = async (): Promise<VolcanoFeature[]> => {
    const volcanoes: VolcanoFeature[] = [
        { id: 'v1', name: 'Kīlauea', location: 'Hawaii, USA', coordinates: [19.421, -155.287], status: 'Erupting', lastEruption: 'Ongoing', elevation: 1222, type: 'Shield' },
        { id: 'v2', name: 'Mount Etna', location: 'Sicily, Italy', coordinates: [37.751, 14.993], status: 'Erupting', lastEruption: '2024', elevation: 3357, type: 'Stratovolcano' },
        { id: 'v3', name: 'Merapi', location: 'Central Java, Indonesia', coordinates: [-7.54, 110.44], status: 'Erupting', lastEruption: 'Ongoing', elevation: 2930, type: 'Stratovolcano' },
        { id: 'v4', name: 'Popocatépetl', location: 'Mexico', coordinates: [19.022, -98.627], status: 'Erupting', lastEruption: 'Ongoing', elevation: 5426, type: 'Stratovolcano' },
        { id: 'v5', name: 'Sakurajima', location: 'Kyushu, Japan', coordinates: [31.593, 130.657], status: 'Erupting', lastEruption: 'Ongoing', elevation: 1117, type: 'Stratovolcano' },
        { id: 'v6', name: 'Fagradalsfjall', location: 'Iceland', coordinates: [63.903, -22.273], status: 'Unrest', lastEruption: '2024', elevation: 385, type: 'Tuya' },
        { id: 'v7', name: 'Stromboli', location: 'Aeolian Islands, Italy', coordinates: [38.789, 15.213], status: 'Erupting', lastEruption: 'Ongoing', elevation: 924, type: 'Stratovolcano' },
        { id: 'v8', name: 'Ebeko', location: 'Paramushir Island, Russia', coordinates: [50.686, 156.014], status: 'Erupting', lastEruption: '2024', elevation: 1156, type: 'Somma' },
        { id: 'v9', name: 'Santa Maria', location: 'Guatemala', coordinates: [14.756, -91.552], status: 'Erupting', lastEruption: 'Ongoing', elevation: 3772, type: 'Stratovolcano' },
        { id: 'v10', name: 'Dukono', location: 'Halmahera, Indonesia', coordinates: [1.693, 127.894], status: 'Erupting', lastEruption: 'Ongoing', elevation: 1335, type: 'Complex' },
        { id: 'v11', name: 'Erta Ale', location: 'Ethiopia', coordinates: [13.6, 40.67], status: 'Erupting', lastEruption: 'Ongoing', elevation: 613, type: 'Shield' },
        { id: 'v12', name: 'Yasur', location: 'Vanuatu', coordinates: [-19.532, 169.447], status: 'Erupting', lastEruption: 'Ongoing', elevation: 361, type: 'Stratovolcano' },
        { id: 'v13', name: 'Sangay', location: 'Ecuador', coordinates: [-2.002, -78.341], status: 'Erupting', lastEruption: 'Ongoing', elevation: 5230, type: 'Stratovolcano' },
        { id: 'v14', name: 'Nyiragongo', location: 'DR Congo', coordinates: [-1.52, 29.25], status: 'Unrest', lastEruption: '2021', elevation: 3470, type: 'Stratovolcano' },
        { id: 'v15', name: 'Semeru', location: 'East Java, Indonesia', coordinates: [-8.108, 112.92], status: 'Erupting', lastEruption: 'Ongoing', elevation: 3676, type: 'Stratovolcano' }
    ];
    
    // Simulating an async fetch
    return new Promise((resolve) => {
        setTimeout(() => resolve(volcanoes), 500);
    });
};
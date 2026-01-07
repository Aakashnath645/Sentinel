import { ISSPosition } from '../types';

const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

export const fetchISSPosition = async (): Promise<ISSPosition | null> => {
    try {
        const response = await fetch(ISS_API_URL);
        if (!response.ok) throw new Error('ISS API Failed');
        
        const data = await response.json();
        
        // Validate coordinates
        if (typeof data.latitude !== 'number' || isNaN(data.latitude) || 
            typeof data.longitude !== 'number' || isNaN(data.longitude)) {
            console.warn('Invalid ISS coordinates received', data);
            return null;
        }

        return {
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: typeof data.altitude === 'number' ? data.altitude : 0,
            velocity: typeof data.velocity === 'number' ? data.velocity : 0,
            visibility: data.visibility || 'unknown',
            timestamp: data.timestamp || Date.now()
        };
    } catch (e) {
        console.error("ISS Fetch Error", e);
        return null;
    }
};
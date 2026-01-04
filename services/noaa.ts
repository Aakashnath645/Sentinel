import { SpaceWeather } from '../types';

const NOAA_KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';

export const fetchSpaceWeather = async (): Promise<SpaceWeather | null> => {
    try {
        const response = await fetch(NOAA_KP_URL);
        if (!response.ok) throw new Error('NOAA API Failed');
        
        const data = await response.json();
        // data structure: [["time_tag","Kp",...], ["2024...", "3.33", ...], ...]
        // We need at least the header and one data row
        if (!data || !Array.isArray(data) || data.length < 2) return null;
        
        // Get the very last entry in the array for the most current data
        const latest = data[data.length - 1];
        const kp = parseFloat(latest[1]);
        const time = latest[0];
        
        let status: SpaceWeather['status'] = 'Quiet';
        // NOAA Scales: G1 starts at Kp=5
        if (kp >= 5) status = 'Storm';
        else if (kp >= 4) status = 'Unsettled';
        
        return { kp, time, status };
    } catch (e) {
        console.error("Space Weather Fetch Error", e);
        return null;
    }
};
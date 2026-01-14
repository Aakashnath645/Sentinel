export const getMagColor = (mag: number) => {
    if (mag < 2.0) return 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    if (mag < 4.5) return 'text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
    if (mag < 6.0) return 'text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
    return 'text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse';
};
  
export const formatTimeAgo = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 60000; // minutes
    if (diff < 60) return `${Math.floor(diff)} MIN`;
    const hours = diff / 60;
    return `${Math.floor(hours)} HRS`;
};

export const calculateEnergy = (mag: number) => {
    // Gutenberg-Richter energy formula: log E = 4.8 + 1.5M
    // E = 10^(4.8 + 1.5M)
    return Math.pow(10, 4.8 + 1.5 * mag);
};

export const formatEnergy = (joules: number) => {
    if (joules > 1e15) return `${(joules / 1e15).toFixed(2)} PJ`; // PetaJoules
    if (joules > 1e12) return `${(joules / 1e12).toFixed(2)} TJ`; // TeraJoules
    if (joules > 1e9) return `${(joules / 1e9).toFixed(2)} GJ`; // GigaJoules
    return `${(joules / 1e6).toFixed(2)} MJ`; // MegaJoules
};

export const getTNTEquivalent = (mag: number) => {
    if (mag < 2) return "Construction Site Blast";
    if (mag < 3) return "Large Quarry Blast";
    if (mag < 4) return "Small Atomic Bomb (0.1 kt)";
    if (mag < 5) return "Average Tornado Energy";
    if (mag < 6) return "Hiroshima Bomb (15 kt)";
    if (mag < 7) return "Largest Thermonuclear Test (50 Mt)";
    if (mag < 8) return "San Francisco 1906 Earthquake";
    if (mag < 9) return "Krakatoa Eruption (200 Mt)";
    if (mag < 10) return "World's Total Nuclear Arsenal";
    return "Asteroid Impact (Extinction Level)";
};

export const getEnergyJoules = (mag: number) => {
    const exp = 5.24 + 1.44 * mag;
    return `10^${exp.toFixed(1)} J`;
};
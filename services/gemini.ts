import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EarthquakeFeature } from "../types";

// Helper to get AI instance safely
const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeEarthquakeNews = async (quake: EarthquakeFeature): Promise<{ text: string; sources: any[] }> => {
  const ai = getAI();
  const prompt = `Analyze this earthquake event:
  Location: ${quake.properties.place}
  Magnitude: ${quake.properties.mag}
  Time: ${new Date(quake.properties.time).toLocaleString()}
  
  Please provide a brief summary of any recent news reports, geological context for this specific region, or potential impact assessments. If it just happened, explain the tectonic setting of this region.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No analysis available.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { text: "Failed to retrieve analysis.", sources: [] };
  }
};

export const findNearbyInfrastructure = async (lat: number, lng: number): Promise<{ text: string; sources: any[] }> => {
    const ai = getAI();
    const prompt = `Identify critical emergency infrastructure (hospitals, fire stations, emergency response centers) closest to these coordinates: Latitude ${lat}, Longitude ${lng}. Provide a list with distances if possible.`;
  
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
              retrievalConfig: {
                  latLng: {
                      latitude: lat,
                      longitude: lng
                  }
              }
          }
        },
      });
  
      const text = response.text || "No nearby infrastructure data found.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
      return { text, sources };
    } catch (error) {
      console.error("Gemini Maps Error:", error);
      return { text: "Failed to retrieve infrastructure data.", sources: [] };
    }
  };
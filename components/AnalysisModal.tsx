import React, { useState, useEffect } from 'react';
import { X, Globe, MapPin, Newspaper, Loader2, AlertTriangle } from 'lucide-react';
import { EarthquakeFeature, GroundingChunk } from '../types';
import * as GeminiService from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface AnalysisModalProps {
  quake: EarthquakeFeature | null;
  onClose: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ quake, onClose }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'maps'>('news');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quake) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setContent('');
      setSources([]);

      try {
        let result;
        if (activeTab === 'news') {
          result = await GeminiService.analyzeEarthquakeNews(quake);
        } else {
          // GeoJSON coordinates are [Long, Lat, Depth]
          const lat = quake.geometry.coordinates[1];
          const lng = quake.geometry.coordinates[0];
          result = await GeminiService.findNearbyInfrastructure(lat, lng);
        }
        setContent(result.text);
        setSources(result.sources);
      } catch (err) {
        setError("Failed to generate analysis. Please check your API key.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quake, activeTab]);

  if (!quake) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded font-bold text-sm ${getMagColor(quake.properties.mag)}`}>
               M {quake.properties.mag.toFixed(1)}
            </span>
            <h2 className="text-xl font-bold text-slate-100 truncate max-w-[300px] sm:max-w-md">
              AI Analysis: {quake.properties.place}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'news' 
                ? 'bg-slate-800 text-teal-400 border-b-2 border-teal-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Situational Report</span>
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'maps' 
                ? 'bg-slate-800 text-teal-400 border-b-2 border-teal-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Nearby Infrastructure</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-slate-400 animate-pulse">Consulting Sentinel AI Network...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400 space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {/* Sources / Grounding */}
              {sources && sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {activeTab === 'news' ? 'Verified Sources' : 'Location Data'}
                  </h4>
                  <div className="grid gap-2">
                    {sources.map((source, idx) => (
                      <div key={idx} className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex flex-col text-sm">
                        {source.web && (
                           <a 
                             href={source.web.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-teal-400 hover:text-teal-300 flex items-center space-x-2 truncate"
                           >
                             <Globe className="w-3 h-3 flex-shrink-0" />
                             <span className="truncate">{source.web.title}</span>
                           </a>
                        )}
                        {source.maps && (
                            <a 
                                href={source.maps.uri}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-teal-400 hover:text-teal-300 flex items-center space-x-2 truncate"
                            >
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{source.maps.title}</span>
                            </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper for color consistency
const getMagColor = (mag: number) => {
  if (mag < 2.0) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
  if (mag < 4.5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
  if (mag < 6.0) return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
  return 'bg-red-500/20 text-red-500 border border-red-500/50';
};

export default AnalysisModal;
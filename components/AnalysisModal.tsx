import React, { useState, useEffect } from 'react';
import { X, Globe, MapPin, Newspaper, Loader2, AlertTriangle, ScanLine } from 'lucide-react';
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900/90 border border-cyan-500/30 w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] relative overflow-hidden">
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

        {/* Header */}
        <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <ScanLine className="w-5 h-5 text-cyan-500" />
            <div>
                 <h2 className="text-lg font-bold text-cyan-50 uppercase tracking-widest">
                  AI INTELLIGENCE REPORT
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>TARGET: {quake.properties.place.toUpperCase()}</span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors border border-transparent hover:border-red-500/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-900/50 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition-all text-xs font-bold tracking-wider uppercase border-b-2 ${
              activeTab === 'news' 
                ? 'bg-cyan-900/20 text-cyan-400 border-cyan-400' 
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>SitRep</span>
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition-all text-xs font-bold tracking-wider uppercase border-b-2 ${
              activeTab === 'maps' 
                ? 'bg-cyan-900/20 text-cyan-400 border-cyan-400' 
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Infrastructure</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-scanline">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="text-cyan-500 animate-pulse text-xs tracking-[0.2em] uppercase">Processing Data Stream...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400 space-x-2 border border-red-500/20 bg-red-500/5 p-4">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm uppercase">{error}</span>
            </div>
          ) : (
            <>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-sans leading-relaxed">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {/* Sources / Grounding */}
              {sources && sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-cyan-900/30">
                  <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-3">
                    {activeTab === 'news' ? 'INTELLIGENCE SOURCES' : 'VECTOR DATA'}
                  </h4>
                  <div className="grid gap-2">
                    {sources.map((source, idx) => (
                      <div key={idx} className="bg-slate-950/50 p-2 border-l-2 border-cyan-500/50 flex flex-col text-xs hover:bg-slate-900 transition-colors">
                        {source.web && (
                           <a 
                             href={source.web.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-cyan-400 hover:text-cyan-200 flex items-center space-x-2 truncate"
                           >
                             <Globe className="w-3 h-3 flex-shrink-0" />
                             <span className="truncate font-mono">{source.web.title}</span>
                           </a>
                        )}
                        {source.maps && (
                            <a 
                                href={source.maps.uri}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-200 flex items-center space-x-2 truncate"
                            >
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate font-mono">{source.maps.title}</span>
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
        
        {/* Footer Status Bar */}
        <div className="p-2 bg-slate-950 border-t border-cyan-900/30 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-widest">
             <span>SECURE CONNECTION</span>
             <span className="text-cyan-900">ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
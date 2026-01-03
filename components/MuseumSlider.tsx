import React from 'react';
import { LEGENDS } from '../data/legends';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

interface MuseumSliderProps {
  currentIndex: number;
  onChange: (index: number) => void;
}

const MuseumSlider: React.FC<MuseumSliderProps> = ({ currentIndex, onChange }) => {
  const currentLegend = LEGENDS[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) onChange(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < LEGENDS.length - 1) onChange(currentIndex + 1);
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-4xl z-[1000] flex flex-col items-center">
      
      {/* Date Display floating above thumb */}
      <div className="mb-4 bg-slate-900/90 border border-cyan-500/50 px-6 py-2 rounded-full text-cyan-400 font-mono font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-3">
        <History className="w-5 h-5" />
        <span>{currentLegend.year}</span>
        <span className="text-slate-500 text-sm">|</span>
        <span className="text-slate-100 text-sm">{currentLegend.date}</span>
      </div>

      {/* Slider Controls Container */}
      <div className="w-full bg-slate-950/80 border border-slate-700/50 p-2 rounded-xl backdrop-blur-sm flex items-center gap-4 shadow-2xl relative overflow-hidden">
        {/* Scanline bg */}
        <div className="absolute inset-0 bg-scanline opacity-20 pointer-events-none"></div>

        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative h-12 flex items-center">
            {/* Custom Track */}
            <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-cyan-900 to-cyan-400 transition-all duration-300"
                    style={{ width: `${(currentIndex / (LEGENDS.length - 1)) * 100}%` }}
                />
            </div>

            {/* Range Input (Invisible but interactive) */}
            <input 
                type="range"
                min={0}
                max={LEGENDS.length - 1}
                step={1}
                value={currentIndex}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Ticks */}
            <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none z-10">
                {LEGENDS.map((legend, idx) => (
                    <div 
                        key={legend.id}
                        className={`transition-all duration-300 ${
                            idx === currentIndex 
                            ? 'w-4 h-4 bg-cyan-400 border-2 border-white shadow-[0_0_10px_rgba(6,182,212,0.8)]' 
                            : 'w-1.5 h-1.5 bg-slate-600'
                        } rounded-full`}
                    />
                ))}
            </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentIndex === LEGENDS.length - 1}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MuseumSlider;
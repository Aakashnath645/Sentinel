import React, { useEffect, useState } from 'react';
import { Radio, Activity, ShieldCheck, Globe, Cpu, ScanLine } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [text, setText] = useState("");
  
  const fullText = "SENTINEL";

  useEffect(() => {
    // 1. Text Typing Effect
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
            setText(fullText.slice(0, currentIndex));
            currentIndex++;
        } else {
            clearInterval(typeInterval);
        }
    }, 150);

    // 2. Progress Bar Logic
    const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) return 100;
            const diff = 100 - prev;
            const increment = Math.random() * (diff / 10); 
            return Math.min(prev + increment, 100);
        });
    }, 100);

    // 3. Timeline
    const exitTimer = setTimeout(() => {
        setIsExiting(true);
    }, 3500); // Start fade out at 3.5s

    const completeTimer = setTimeout(() => {
        onComplete();
    }, 4500); // Unmount at 4.5s (1s fade)

    return () => {
        clearInterval(typeInterval);
        clearInterval(progressInterval);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      
      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Icon */}
        <div className="relative mb-8">
             <div className="absolute inset-0 bg-cyan-500 blur-[40px] opacity-20 animate-pulse"></div>
             <div className="relative w-24 h-24 flex items-center justify-center">
                 {/* Rotating Rings */}
                 <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
                 <div className="absolute inset-2 border border-cyan-400/20 rounded-full border-t-transparent animate-[spin_3s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-4 border border-cyan-300/10 rounded-full border-b-transparent animate-[spin_2s_linear_infinite]"></div>
                 
                 <Radio className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" />
             </div>
        </div>

        {/* Title */}
        <h1 className="text-7xl md:text-9xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 font-['Rajdhani'] leading-none mb-4 drop-shadow-2xl">
          {text}<span className="animate-blink text-cyan-500">_</span>
        </h1>

        {/* Subtitle / Version */}
        <div className="flex items-center gap-4 text-cyan-500/70 font-mono tracking-[0.4em] text-xs md:text-sm uppercase mb-12">
           <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> Global Seismic Monitor</span>
           <span className="w-1 h-1 bg-cyan-500 rounded-full"></span>
           <span>v2.0.4</span>
        </div>

        {/* Loading Bar */}
        <div className="w-64 md:w-96 space-y-2">
            <div className="h-0.5 bg-slate-900 w-full relative overflow-hidden">
                <div 
                    className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-100 ease-out"
                    style={{ width: `${Math.round(progress)}%` }}
                ></div>
            </div>
            <div className="flex justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                    {progress < 100 ? (
                        <><Cpu className="w-3 h-3 animate-spin" /> ESTABLISHING LINK...</>
                    ) : (
                        <><ScanLine className="w-3 h-3" /> CONNECTION SECURE</>
                    )}
                </span>
                <span className="text-cyan-500">{Math.round(progress)}%</span>
            </div>
        </div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-900/50"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-cyan-900/50"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-cyan-900/50"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-cyan-900/50"></div>

    </div>
  );
};

export default SplashScreen;
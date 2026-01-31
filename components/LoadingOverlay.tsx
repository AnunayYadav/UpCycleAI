
import React from 'react';
import { Loader2, Sparkles, Recycle } from 'lucide-react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
      {/* Dynamic background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500 rounded-full blur-[100px] animate-pulseSlow"></div>
      </div>

      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-10"></div>
        <div className="w-24 h-24 bg-midnight-card rounded-[32px] border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] relative z-10 overflow-hidden">
          <Recycle className="w-10 h-10 text-emerald-500 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent"></div>
        </div>
      </div>
      
      <h3 className="text-3xl font-black text-white mb-3 tracking-tight">ANALYZING <span className="text-emerald-500">WASTE</span></h3>
      <p className="text-gray-500 font-medium max-w-xs leading-relaxed mb-10">
        Our AI is scanning shape, material and context to find creative treasures.
      </p>
      
      <div className="flex items-center gap-3 px-6 py-3 bg-midnight-card border border-white/5 rounded-full text-xs font-black tracking-widest text-emerald-500 uppercase shadow-xl">
        <Loader2 className="w-4 h-4 animate-spin" />
        Consulting Gemini AI
      </div>
    </div>
  );
};

export default LoadingOverlay;

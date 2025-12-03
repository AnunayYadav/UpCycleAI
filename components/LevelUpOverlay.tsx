
import React, { useEffect, useState } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { playSound } from '../services/soundService';

interface LevelUpOverlayProps {
  level: number;
  title: string;
  onClose: () => void;
}

const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ level, title, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    playSound('success');
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(255,215,0,0.5)] overflow-hidden animate-blob">
        
        {/* Confetti effects (simulated with CSS circles) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
           <div className="absolute top-10 left-10 w-4 h-4 bg-red-400 rounded-full animate-bounce delay-100"></div>
           <div className="absolute top-20 right-20 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300"></div>
           <div className="absolute bottom-32 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-500"></div>
           <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
           <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-ping delay-200"></div>
        </div>

        <div className="relative z-10">
          <div className="mx-auto w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-extrabold text-orange-600 mb-1 animate-slideUp">LEVEL UP!</h2>
          <div className="text-6xl font-black text-gray-900 mb-2 animate-scaleIn">{level}</div>
          <p className="text-gray-600 font-medium text-sm uppercase tracking-widest mb-6">New Title Unlocked</p>
          
          <div className="bg-white/80 rounded-xl p-4 mb-8 shadow-inner">
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5 fill-current" />
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpOverlay;

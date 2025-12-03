
import React from 'react';
import { Achievement } from '../types';
import { X, Trophy, Lock } from 'lucide-react';

interface AchievementDetailProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementDetail: React.FC<AchievementDetailProps> = ({ achievement, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-50"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="flex flex-col items-center justify-center w-full max-w-sm">
        
        {/* 3D Rotating Badge */}
        <div className="relative w-48 h-48 mb-12 preserve-3d animate-rotate3d">
            {/* Front side simulated with rotation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 shadow-[0_0_60px_rgba(255,215,0,0.6)] flex items-center justify-center border-4 border-white/20">
               <div className="w-36 h-36 rounded-full bg-white/90 flex items-center justify-center shadow-inner">
                  {achievement.unlocked ? (
                    <Trophy className="w-20 h-20 text-yellow-600 drop-shadow-md" />
                  ) : (
                    <Lock className="w-20 h-20 text-gray-400" />
                  )}
               </div>
               
               {/* Shine effect */}
               <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none"></div>
            </div>
        </div>

        <div className="text-center space-y-4 animate-slideUp">
           <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400">
             {achievement.title}
           </h2>
           <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${achievement.unlocked ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
             {achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}
           </div>
           <p className="text-gray-300 text-lg max-w-xs mx-auto leading-relaxed">
             {achievement.description}
           </p>
           
           {achievement.unlocked && achievement.unlockedAt && (
             <p className="text-sm text-gray-500">
               Earned on {new Date(achievement.unlockedAt).toLocaleDateString()}
             </p>
           )}
        </div>

      </div>
    </div>
  );
};

export default AchievementDetail;


import React from 'react';
import { X, Check, Star, Zap, Crown, Sliders, Image as ImageIcon } from 'lucide-react';
import { playSound } from '../services/soundService';

interface PremiumModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgrade }) => {
  const handleUpgrade = () => {
    playSound('success');
    onUpgrade();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl relative border border-yellow-500/30 max-h-[85vh] flex flex-col">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Header */}
          <div className="relative p-8 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,165,0,0.5)] transform rotate-3">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">UpcycleAI <span className="text-yellow-400">Premium</span></h2>
              <p className="text-gray-300">Unlock the full potential of your trash.</p>
            </div>
          </div>

          {/* Features List */}
          <div className="px-6 pb-6">
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg"><Zap className="w-5 h-5 text-gray-400" /></div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Standard Scanning</p>
                    <p className="text-xs text-gray-400">Basic ideas</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-gray-700 rounded-full text-xs font-bold text-gray-300">Free</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg"><Sliders className="w-5 h-5 text-white" /></div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Advanced Filters</p>
                    <p className="text-xs text-yellow-200/70">Decor, Garden, Fashion & more</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-yellow-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                  <Check className="w-3 h-3" /> PRO
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg"><Star className="w-5 h-5 text-white" /></div>
                  <div className="text-left">
                    <p className="text-white font-semibold">2x XP Gain</p>
                    <p className="text-xs text-yellow-200/70">Level up faster</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-yellow-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                   <Check className="w-3 h-3" /> PRO
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg"><ImageIcon className="w-5 h-5 text-white" /></div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Unlimited Visuals</p>
                    <p className="text-xs text-yellow-200/70">AI visualizations for every step</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-yellow-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                   <Check className="w-3 h-3" /> PRO
                </div>
              </div>
            </div>

            <button 
              onClick={handleUpgrade}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group mb-4"
            >
              <Crown className="w-6 h-6 fill-white group-hover:rotate-12 transition-transform" />
              Upgrade Now - $4.99/mo
            </button>
            
            <p className="text-center text-xs text-gray-500">
              Cancel anytime. Restore purchases in Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;

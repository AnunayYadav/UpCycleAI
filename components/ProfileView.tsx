
import React, { useState } from 'react';
import { UserProfile, LEVELS, Theme, Achievement } from '../types';
import { User, Trophy, Calendar, Zap, Share2, Moon, Sun, Award, Flame, Lock } from 'lucide-react';
import ShareModal from './ShareModal';
import AchievementDetail from './AchievementDetail';
import { playSound } from '../services/soundService';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateTheme: (theme: Theme) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userProfile, onUpdateTheme }) => {
  const [showShare, setShowShare] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const currentLevelData = LEVELS.find(l => l.level === userProfile.level) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === userProfile.level + 1);
  
  const xpForCurrentLevel = currentLevelData.minXp;
  const xpForNextLevel = nextLevelData ? nextLevelData.minXp : xpForCurrentLevel * 1.5;
  
  const progress = Math.min(100, Math.max(0, 
    ((userProfile.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
  ));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isDarkMode = userProfile.settings?.theme === 'dark';

  const handleAchievementClick = (achievement: Achievement) => {
    playSound('click');
    setSelectedAchievement(achievement);
  };

  return (
    <div className="animate-fadeIn pb-24 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-8 px-1">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Profile</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => onUpdateTheme(isDarkMode ? 'light' : 'dark')}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-midnight-card text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all border border-black/5 dark:border-white/5"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setShowShare(true)}
            className="p-3 rounded-2xl bg-emerald-500 text-black hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showShare && <ShareModal userProfile={userProfile} onClose={() => setShowShare(false)} />}
      
      {selectedAchievement && (
        <AchievementDetail 
          achievement={selectedAchievement} 
          onClose={() => setSelectedAchievement(null)} 
        />
      )}

      {/* Stats Card */}
      <div className="bg-gray-900 dark:bg-midnight-card rounded-[40px] p-8 text-white shadow-2xl mb-10 relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex items-center gap-6 mb-8 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md">
              <User className="w-10 h-10 text-emerald-500" />
            </div>
            {userProfile.streak > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-xl flex items-center border-2 border-gray-900 shadow-lg">
                <Flame className="w-3.5 h-3.5 mr-1 fill-current" /> {userProfile.streak}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-black text-white">{currentLevelData.title}</h3>
              <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">LVL {userProfile.level}</span>
            </div>
            <p className="text-gray-400 font-medium">{userProfile.xp} XP Total</p>
          </div>
        </div>

        <div className="mb-3 flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-500">
          <span>{Math.round(progress)}% progress</span>
          <span className="text-emerald-500">Next: {LEVELS.find(l => l.level === userProfile.level + 1)?.title || "Max"}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 mb-8 shadow-inner border border-white/5">
          <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
             <div className="text-3xl font-black mb-1">{userProfile.scansCount}</div>
             <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Scans</div>
          </div>
          <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
             <div className="text-3xl font-black mb-1">{userProfile.buildsCount}</div>
             <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Master Builds</div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest mb-5 flex items-center gap-2 text-gray-500">
          <Award className="w-4 h-4" /> Achievements
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {userProfile.achievements.map((achievement) => (
            <div 
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement)}
              className={`p-5 rounded-[32px] border transition-all duration-300 cursor-pointer active:scale-95
                ${achievement.unlocked 
                ? 'bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20 shadow-sm' 
                : 'bg-gray-100 dark:bg-white/5 border-transparent opacity-60 dark:opacity-40'}
              `}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-2xl ${achievement.unlocked ? 'bg-emerald-500 text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-400'}`}>
                  {achievement.unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">{achievement.title}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-5 flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" /> Recent History
        </h3>
        
        {userProfile.history.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-midnight-card rounded-3xl border border-black/5 dark:border-white/5">
            <p className="text-gray-400 font-medium">No activity yet. Go explore!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userProfile.history.slice().reverse().slice(0, 10).map((item) => (
              <div key={item.id} className="bg-gray-50 dark:bg-midnight-card border border-black/5 dark:border-white/5 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${item.type === 'build' ? 'bg-emerald-500 text-black' : 'bg-blue-500/10 text-blue-500'}`}>
                    {item.type === 'build' ? <Trophy className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 dark:text-white text-sm line-clamp-1">{item.itemName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.type} • {formatDate(item.date)}</p>
                  </div>
                </div>
                <div className="font-black text-emerald-500 text-sm">+{item.xpGained} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;

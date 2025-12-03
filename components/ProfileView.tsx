
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
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-2xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">My Profile</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => onUpdateTheme(isDarkMode ? 'light' : 'dark')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-[0_0_10px_rgba(253,224,71,0.3)]"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowShare(true)}
            className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors shadow-sm hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]"
          >
            <Share2 className="w-5 h-5" />
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
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-green-900 dark:to-emerald-950 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden shadow-green-900/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)]">
              <User className="w-8 h-8 text-green-400 drop-shadow-md" />
            </div>
            {userProfile.streak > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center border-2 border-gray-900 shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                <Flame className="w-3 h-3 mr-0.5 fill-current" /> {userProfile.streak}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold drop-shadow-sm">{currentLevelData.title}</h3>
              <span className="bg-green-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]">Lvl {userProfile.level}</span>
            </div>
            <p className="text-gray-400 text-sm">{userProfile.xp} XP Total</p>
          </div>
        </div>

        <div className="mb-2 flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span>{Math.round(progress)}% to Lvl {userProfile.level + 1}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 shadow-inner">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.6)]" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex justify-between gap-4">
          <div className="bg-white/10 rounded-2xl p-3 flex-1 text-center border border-white/5 hover:bg-white/15 transition-colors">
             <div className="text-2xl font-bold drop-shadow-sm">{userProfile.scansCount}</div>
             <div className="text-xs text-gray-400 uppercase tracking-wide">Scans</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex-1 text-center border border-white/5 hover:bg-white/15 transition-colors">
             <div className="text-2xl font-bold drop-shadow-sm">{userProfile.buildsCount}</div>
             <div className="text-xs text-gray-400 uppercase tracking-wide">Builds</div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 drop-shadow-sm">
          <Award className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {userProfile.achievements.map((achievement) => (
            <div 
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement)}
              className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all active:scale-95 ${
                achievement.unlocked 
                ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-900 shadow-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`p-1.5 rounded-lg ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-gray-200 text-gray-400'}`}>
                  {achievement.unlocked ? <Trophy className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate drop-shadow-sm">{achievement.title}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 drop-shadow-sm">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Recent Activity
        </h3>
        
        {userProfile.history.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-400 text-sm">No activity yet. Start scanning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userProfile.history.slice().reverse().slice(0, 10).map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.type === 'build' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'}`}>
                    {item.type === 'build' ? <Trophy className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-1 drop-shadow-sm">{item.itemName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.type} • {formatDate(item.date)}</p>
                  </div>
                </div>
                <div className="font-bold text-green-600 dark:text-green-400 text-sm drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">+{item.xpGained} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;

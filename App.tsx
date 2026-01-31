
import React, { useState, useEffect } from 'react';
import { Scan, Leaf, Recycle, ChevronRight, Heart, Home, User, Search, Camera as CameraIcon, Clock, ArrowRight, X, Quote, Crown, Sliders, Lock, Zap, Star, Trophy, Target } from 'lucide-react';
import Camera from './components/Camera';
import ProjectCard from './components/ProjectCard';
import LoadingOverlay from './components/LoadingOverlay';
import TutorialView from './components/TutorialView';
import ProfileView from './components/ProfileView';
import LevelUpOverlay from './components/LevelUpOverlay';
import PremiumModal from './components/PremiumModal';
import { analyzeItem, generateQuickTip } from './services/geminiService';
import { playSound } from './services/soundService';
import { calculateXP, checkAchievements, updateStreak, INITIAL_ACHIEVEMENTS } from './services/gamificationService';
import { AppState, AnalysisResult, UpcycleProject, UserProfile, LEVELS, HistoryItem, Theme, ProjectCategory } from './types';

const INITIAL_PROFILE: UserProfile = {
  xp: 0,
  level: 1,
  scansCount: 0,
  buildsCount: 0,
  completedProjectIds: [],
  history: [],
  streak: 0,
  lastActiveDate: new Date().toISOString(),
  achievements: INITIAL_ACHIEVEMENTS,
  isPremium: false,
  settings: {
    theme: 'dark' 
  }
};

const PROJECT_CATEGORIES: { id: ProjectCategory; label: string; icon: string }[] = [
  { id: 'All', label: 'Surprise Me', icon: '✨' },
  { id: 'Decor', label: 'Home Decor', icon: '🏠' },
  { id: 'Organization', label: 'Storage', icon: '📦' },
  { id: 'Garden', label: 'Garden', icon: '🌱' },
  { id: 'Fashion', label: 'Fashion', icon: '👗' },
  { id: 'Kids', label: 'For Kids', icon: '🧸' },
  { id: 'Furniture', label: 'Furniture', icon: '🪑' },
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<UpcycleProject[]>([]);
  const [activeTutorialProject, setActiveTutorialProject] = useState<UpcycleProject | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [levelUpData, setLevelUpData] = useState<{level: number, title: string} | null>(null);
  const [dailyQuote, setDailyQuote] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLevelBreakdown, setShowLevelBreakdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('All');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchImage, setSearchImage] = useState<string | null>(null);

  // Load profile and saved projects
  useEffect(() => {
    const saved = localStorage.getItem('upcycleSavedProjects');
    const profile = localStorage.getItem('upcycleUserProfile');
    
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }

    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        const { streak, lastActiveDate } = updateStreak(parsedProfile);
        setUserProfile({ ...parsedProfile, streak, lastActiveDate });
      } catch (e) {
        setUserProfile(INITIAL_PROFILE);
      }
    }

    const loadTip = async () => {
        const tip = await generateQuickTip();
        setDailyQuote(tip);
    };
    loadTip();
  }, []);

  // Handle Theme Switching
  useEffect(() => {
    const theme = userProfile.settings?.theme || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#000000';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    }
    localStorage.setItem('upcycleUserProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  const handleUpdateTheme = (newTheme: Theme) => {
    playSound('pop');
    setUserProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, theme: newTheme }
    }));
  };

  const handleUpgradeToPremium = () => {
    setUserProfile(prev => ({ ...prev, isPremium: true }));
    setShowPremiumModal(false);
  };

  const addXp = (source: 'scan' | 'build', contextName: string, projectId?: string, result?: AnalysisResult, difficulty?: 'Easy'|'Medium'|'Hard') => {
    let amount = calculateXP(source, difficulty);
    if (userProfile.isPremium) amount *= 2;
    
    setUserProfile(prev => {
      const newXp = prev.xp + amount;
      const nextLevel = LEVELS.find(l => l.level === prev.level + 1);
      let newLevel = prev.level;
      if (nextLevel && newXp >= nextLevel.minXp) {
        newLevel = nextLevel.level;
        setLevelUpData({ level: newLevel, title: nextLevel.title });
        playSound('success');
      }

      const updatedHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        projectId: projectId,
        type: source,
        itemName: contextName,
        date: new Date().toISOString(),
        xpGained: amount,
        result: result
      };

      const provisionalProfile = {
        ...prev,
        xp: newXp,
        level: newLevel,
        scansCount: source === 'scan' ? prev.scansCount + 1 : prev.scansCount,
        buildsCount: source === 'build' ? prev.buildsCount + 1 : prev.buildsCount,
        history: [...prev.history, updatedHistoryItem].slice(-20)
      };

      return {
        ...provisionalProfile,
        achievements: checkAchievements(provisionalProfile, { difficulty })
      };
    });
  };

  const performAnalysis = async (image: string | null, prompt: string) => {
    playSound('shutter');
    setAppState('analyzing');
    setErrorMsg(null);
    try {
      const result = await analyzeItem(image, prompt, categoryFilter);
      setAnalysisResult(result);
      setAppState('results');
      playSound('success');
      addXp('scan', result.identifiedItem, undefined, result);
    } catch (err) {
      setErrorMsg("Analysis failed. Please check your internet connection.");
      setAppState('error');
      playSound('error');
    }
  };

  const handleCategorySelect = (category: ProjectCategory) => {
    if (category === 'All' || userProfile.isPremium) {
      setCategoryFilter(category);
      playSound('click');
    } else {
      setShowPremiumModal(true);
    }
  };

  const currentLevelData = LEVELS.find(l => l.level === userProfile.level) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === userProfile.level + 1);
  const progressPercent = nextLevelData 
    ? ((userProfile.xp - currentLevelData.minXp) / (nextLevelData.minXp - currentLevelData.minXp)) * 100 
    : 100;

  const FilterSelector = () => (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-4">
      <div className="flex gap-2.5 px-1">
        {PROJECT_CATEGORIES.map((cat) => {
           const isLocked = cat.id !== 'All' && !userProfile.isPremium;
           return (
             <button
               key={cat.id}
               onClick={() => handleCategorySelect(cat.id)}
               className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300
                 ${categoryFilter === cat.id 
                   ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                   : 'bg-gray-100 dark:bg-midnight-card text-gray-500 dark:text-gray-400 border-black/5 dark:border-white/5 hover:border-emerald-500/20'}
                 ${isLocked ? 'opacity-70' : ''}
               `}
             >
               <span className="mr-2">{cat.icon}</span>
               {cat.label}
               {isLocked && <Lock className="ml-2 w-3 h-3 inline opacity-50" />}
             </button>
           )
        })}
      </div>
    </div>
  );

  const LevelBreakdown = () => (
    <div className="fixed inset-0 z-[110] animate-fadeIn flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLevelBreakdown(false)}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-midnight-card rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-2xl animate-scaleIn">
         <button onClick={() => setShowLevelBreakdown(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
         </button>
         
         <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-[28px] mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
               <Trophy className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Level {userProfile.level}</h3>
            <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs">{currentLevelData.title}</p>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500">
                  <span>Progress</span>
                  <span className="text-gray-900 dark:text-white">{userProfile.xp} / {nextLevelData?.minXp || 'MAX'} XP</span>
               </div>
               <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/5 text-center">
                  <p className="text-xl font-black text-gray-900 dark:text-white">{userProfile.scansCount}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Scans</p>
               </div>
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/5 text-center">
                  <p className="text-xl font-black text-gray-900 dark:text-white">{userProfile.buildsCount}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Builds</p>
               </div>
            </div>

            {nextLevelData && (
              <div className="flex items-center gap-3 bg-emerald-500/5 dark:bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/20">
                <Target className="w-5 h-5 text-emerald-500" />
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Unlock</p>
                   <p className="text-xs font-bold text-gray-900 dark:text-white">{nextLevelData.title}</p>
                </div>
              </div>
            )}
         </div>

         <button onClick={() => setShowLevelBreakdown(false)} className="w-full mt-8 py-4 bg-emerald-500 text-black font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            GOT IT
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-midnight-black text-gray-900 dark:text-white selection:bg-emerald-500 selection:text-black">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-emerald-500/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-emerald-700/5 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      {levelUpData && <LevelUpOverlay level={levelUpData.level} title={levelUpData.title} onClose={() => setLevelUpData(null)} />}
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} onUpgrade={handleUpgradeToPremium} />}
      {showLevelBreakdown && <LevelBreakdown />}
      
      {/* Profile Sliding Overlay */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowProfile(false)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-midnight-black shadow-2xl animate-slideInRight overflow-y-auto no-scrollbar">
            <div className="p-6">
              <div className="flex justify-end mb-4">
                 <button onClick={() => setShowProfile(false)} className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <ProfileView userProfile={userProfile} onUpdateTheme={handleUpdateTheme} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {appState !== 'camera' && appState !== 'tutorial' && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-3xl px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setAppState('landing'); setShowProfile(false); }}>
            <div className="bg-emerald-500 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transform transition-transform group-hover:rotate-6">
              <Recycle className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-gray-900 dark:text-white">UPCYCLE<span className="text-emerald-500">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => { setShowLevelBreakdown(true); playSound('click'); }}
                className="bg-gray-100 dark:bg-midnight-card px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 group"
             >
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black text-[10px] font-black group-hover:shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-shadow">
                  {userProfile.level}
                </div>
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
             </button>
             {userProfile.isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-28 px-4 max-w-xl mx-auto min-h-screen">
        
        {appState === 'landing' && (
          <div className="flex flex-col items-center text-center mt-4 animate-fadeIn">
            <div className="w-full bg-gray-100 dark:bg-midnight-card p-5 rounded-3xl border border-black/5 dark:border-white/5 mb-10 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic leading-relaxed">"{dailyQuote}"</p>
            </div>

            <div className="relative w-56 h-56 mb-12 group cursor-pointer" onClick={() => setAppState('camera')}>
               <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-10 animate-ping"></div>
               <div className="absolute inset-4 bg-emerald-500 rounded-full opacity-5 animate-pulseSlow"></div>
               <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
               <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=60" 
                    alt="Eco Art" className="absolute inset-0 w-full h-full object-cover rounded-full p-2"
                    style={{ clipPath: 'circle(48% at 50% 50%)' }} />
               <div className="absolute bottom-4 right-4 bg-emerald-500 p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transform group-hover:rotate-12 transition-transform duration-500">
                 <Leaf className="w-8 h-8 text-black" />
               </div>
            </div>

            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight leading-none">
              TRASH TO <br/>
              <span className="text-emerald-500 emerald-text-glow">TREASURE</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xs leading-relaxed">
              Unlock creative DIY projects from everyday items you'd usually discard.
            </p>
            
            <div className="w-full mb-8">
               <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                  <Sliders className="w-4 h-4" /> Style Target
               </div>
               <FilterSelector />
            </div>

            <button onClick={() => setAppState('camera')} className="w-full py-5 bg-emerald-500 text-black text-lg font-black rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.03] active:scale-95 transition-all mb-4 flex items-center justify-center gap-3">
              <Scan className="w-6 h-6" /> START SCANNING
            </button>

            <button onClick={() => setAppState('search')} className="w-full py-5 bg-gray-100 dark:bg-midnight-card text-gray-900 dark:text-white text-lg font-bold rounded-3xl border border-black/5 dark:border-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-3">
              <Search className="w-5 h-5" /> SEARCH MANUALLY
            </button>
          </div>
        )}

        {appState === 'search' && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black mb-6">WHAT'S IN THE <span className="text-emerald-500">BIN?</span></h2>
            <FilterSelector />
            <div className="relative mb-6">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Old jeans, wine bottles, amazon boxes..."
                className="w-full bg-gray-50 dark:bg-midnight-card border-2 border-black/5 dark:border-white/5 rounded-3xl p-5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all h-40"
              />
              <label className="absolute bottom-4 right-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-emerald-500/20 transition-colors">
                 <CameraIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                 <input type="file" accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onloadend = () => setSearchImage((reader.result as string).split(',')[1]);
                     reader.readAsDataURL(file);
                   }
                 }} className="hidden" />
              </label>
            </div>
            {searchImage && (
              <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 mb-6">
                <span className="text-xs font-black text-emerald-500">IMAGE READY</span>
                <button onClick={() => setSearchImage(null)}><X className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={() => performAnalysis(searchImage, searchQuery)} disabled={!searchQuery && !searchImage} className="w-full py-5 bg-emerald-500 text-black font-black rounded-3xl shadow-lg disabled:opacity-50">
              GENERATE IDEAS
            </button>
          </div>
        )}

        {appState === 'analyzing' && <LoadingOverlay />}
        {appState === 'results' && analysisResult && (
          <div className="animate-slideUp space-y-6">
            <div className="bg-gray-100 dark:bg-midnight-card p-6 rounded-3xl border border-emerald-500/30 shadow-sm">
              <span className="text-emerald-500 text-xs font-black tracking-widest uppercase">Target Item</span>
              <h2 className="text-3xl font-black capitalize">{analysisResult.identifiedItem}</h2>
            </div>
            {analysisResult.projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} identifiedItem={analysisResult.identifiedItem} index={i}
                isSaved={savedProjects.some(sp => sp.id === p.id)}
                isCompleted={userProfile.completedProjectIds.includes(p.id)}
                isPremium={userProfile.isPremium}
                onToggleSave={(project) => {
                  const exists = savedProjects.some(sp => sp.id === project.id);
                  const updated = exists ? savedProjects.filter(sp => sp.id !== project.id) : [...savedProjects, project];
                  setSavedProjects(updated);
                  localStorage.setItem('upcycleSavedProjects', JSON.stringify(updated));
                }}
                onUpdateProject={(upd) => setAnalysisResult({ ...analysisResult, projects: analysisResult.projects.map(p => p.id === upd.id ? upd : p) })}
                onStartTutorial={(project) => { setActiveTutorialProject(project); setAppState('tutorial'); }}
                onShowPremiumModal={() => setShowPremiumModal(true)}
              />
            ))}
          </div>
        )}

        {appState === 'tutorial' && activeTutorialProject && (
          <TutorialView 
            project={activeTutorialProject} identifiedItem={analysisResult?.identifiedItem || "Item"}
            onClose={() => setAppState(analysisResult ? 'results' : 'saved')}
            onComplete={(p) => { addXp('build', p.title, p.id, undefined, p.difficulty); setAppState(analysisResult ? 'results' : 'saved'); }}
            isPremium={userProfile.isPremium}
          />
        )}

        {appState === 'camera' && <Camera onCapture={(img, prompt) => performAnalysis(img, prompt || "")} onClose={() => setAppState('landing')} />}
        
        {appState === 'saved' && (
           <div className="animate-fadeIn">
             <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white">SAVED <span className="text-emerald-500">PROJECTS</span></h2>
             <div className="space-y-4">
               {savedProjects.map((p, i) => (
                  <ProjectCard key={p.id} project={p} identifiedItem="Saved Item" index={i} isSaved={true} 
                    isCompleted={userProfile.completedProjectIds.includes(p.id)} isPremium={userProfile.isPremium}
                    onToggleSave={(project) => {
                      const updated = savedProjects.filter(sp => sp.id !== project.id);
                      setSavedProjects(updated);
                      localStorage.setItem('upcycleSavedProjects', JSON.stringify(updated));
                    }}
                    onUpdateProject={(upd) => setSavedProjects(savedProjects.map(sp => sp.id === upd.id ? upd : sp))}
                    onStartTutorial={(project) => { setActiveTutorialProject(project); setAppState('tutorial'); }}
                    onShowPremiumModal={() => setShowPremiumModal(true)}
                  />
               ))}
               {savedProjects.length === 0 && <p className="text-center text-gray-500 py-20">No saved projects yet.</p>}
             </div>
           </div>
        )}

      </main>

      {/* Nav */}
      {appState !== 'camera' && appState !== 'tutorial' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-3xl px-6 py-4 rounded-[40px] border border-gray-100 dark:border-white/5 flex items-center gap-8 shadow-2xl">
           <button onClick={() => { setAppState('landing'); setShowProfile(false); }} className={`transition-colors ${appState === 'landing' && !showProfile ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500'}`}><Home className="w-6 h-6" /></button>
           <button onClick={() => { setAppState('search'); setShowProfile(false); }} className={`transition-colors ${appState === 'search' && !showProfile ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500'}`}><Search className="w-6 h-6" /></button>
           <button onClick={() => { setAppState('camera'); setShowProfile(false); }} className="bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/40 -translate-y-6 scale-125 border-4 border-white dark:border-black active:scale-110 transition-transform"><Scan className="w-6 h-6 text-black" /></button>
           <button onClick={() => { setAppState('saved'); setShowProfile(false); }} className={`transition-colors ${appState === 'saved' && !showProfile ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500'}`}><Heart className="w-6 h-6" /></button>
           <button onClick={() => { setShowProfile(true); playSound('click'); }} className={`transition-colors ${showProfile ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500'}`}><User className="w-6 h-6" /></button>
        </nav>
      )}
    </div>
  );
};

export default App;

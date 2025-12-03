
import React, { useState, useEffect } from 'react';
import { Scan, Leaf, Recycle, ChevronRight, Heart, Home, User, Search, Camera as CameraIcon, Clock, ArrowRight, X, Quote, Crown, Sliders, Lock, Zap, Star } from 'lucide-react';
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
    theme: 'dark' // Default to dark mode
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
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('All');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchImage, setSearchImage] = useState<string | null>(null);

  // Initialize App
  useEffect(() => {
    const saved = localStorage.getItem('upcycleSavedProjects');
    const profile = localStorage.getItem('upcycleUserProfile');
    
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }

    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        // Migrations for old profiles
        if (!parsedProfile.completedProjectIds) parsedProfile.completedProjectIds = [];
        if (!parsedProfile.achievements) parsedProfile.achievements = INITIAL_ACHIEVEMENTS;
        if (typeof parsedProfile.streak === 'undefined') parsedProfile.streak = 0;
        if (!parsedProfile.lastActiveDate) parsedProfile.lastActiveDate = new Date().toISOString();
        if (!parsedProfile.settings) parsedProfile.settings = { theme: 'dark' };
        if (typeof parsedProfile.isPremium === 'undefined') parsedProfile.isPremium = false;

        // Check streak on load
        const { streak, lastActiveDate } = updateStreak(parsedProfile);
        
        setUserProfile({
           ...parsedProfile,
           streak,
           lastActiveDate
        });
      } catch (e) {
        console.error("Failed to parse profile", e);
        setUserProfile(INITIAL_PROFILE);
      }
    }

    // FAST AI RESPONSE: Generate Dynamic Tip
    const loadTip = async () => {
        const tip = await generateQuickTip();
        setDailyQuote(tip);
    };
    loadTip();

  }, []);

  // Persist Profile & Apply Theme
  useEffect(() => {
    localStorage.setItem('upcycleUserProfile', JSON.stringify(userProfile));
    
    // Apply Theme
    const root = window.document.documentElement;
    if (userProfile.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [userProfile]);

  const updateTheme = (theme: Theme) => {
    setUserProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, theme }
    }));
  };

  const handleUpgradeToPremium = () => {
    setUserProfile(prev => ({
      ...prev,
      isPremium: true
    }));
    setShowPremiumModal(false);
  };

  const addXp = (source: 'scan' | 'build', contextName: string, projectId?: string, result?: AnalysisResult, difficulty?: 'Easy'|'Medium'|'Hard') => {
    let amount = calculateXP(source, difficulty);
    
    // Premium Boost
    if (userProfile.isPremium) {
      amount *= 2;
    }
    
    setUserProfile(prev => {
      const newXp = prev.xp + amount;
      
      const nextLevel = LEVELS.find(l => l.level === prev.level + 1);
      let newLevel = prev.level;
      if (nextLevel && newXp >= nextLevel.minXp) {
        newLevel = nextLevel.level;
        setLevelUpData({ level: newLevel, title: nextLevel.title });
        playSound('success');
      }

      const newCompletedIds = source === 'build' && projectId 
        ? (prev.completedProjectIds.includes(projectId) ? prev.completedProjectIds : [...prev.completedProjectIds, projectId])
        : prev.completedProjectIds;

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
        completedProjectIds: newCompletedIds,
        history: [...prev.history, updatedHistoryItem]
      };

      const newAchievements = checkAchievements(provisionalProfile, { difficulty });

      return {
        ...provisionalProfile,
        achievements: newAchievements
      };
    });
  };

  const handleScanClick = () => {
    playSound('click');
    setAppState('camera');
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
      console.error(err);
      setErrorMsg("Oops! We couldn't analyze that. Please try again.");
      setAppState('error');
      playSound('error');
    }
  };

  const handleImageCaptured = (base64Image: string, userPrompt?: string) => {
    performAnalysis(base64Image, userPrompt || "");
  };

  const handleSearchSubmit = () => {
    if (!searchQuery && !searchImage) return;
    performAnalysis(searchImage, searchQuery);
    setSearchQuery('');
    setSearchImage(null);
  };

  const handleHistoryClick = (item: HistoryItem) => {
    if (item.result) {
        playSound('click');
        setAnalysisResult(item.result);
        setAppState('results');
    }
  };

  const resetApp = () => {
    playSound('click');
    setAppState('landing');
    setAnalysisResult(null);
    setCategoryFilter('All');
  };

  const toggleSaveProject = (project: UpcycleProject) => {
    const isSaved = savedProjects.some(p => p.id === project.id);
    let newSaved;
    
    if (isSaved) {
      newSaved = savedProjects.filter(p => p.id !== project.id);
    } else {
      newSaved = [...savedProjects, project];
    }
    
    setSavedProjects(newSaved);
    localStorage.setItem('upcycleSavedProjects', JSON.stringify(newSaved));
  };

  const updateActiveProject = (updatedProject: UpcycleProject) => {
    if (analysisResult) {
      const newProjects = analysisResult.projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      setAnalysisResult({ ...analysisResult, projects: newProjects });
    }

    if (savedProjects.some(p => p.id === updatedProject.id)) {
      const newSaved = savedProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      setSavedProjects(newSaved);
      localStorage.setItem('upcycleSavedProjects', JSON.stringify(newSaved));
    }
  };

  const handleStartTutorial = (project: UpcycleProject) => {
    setActiveTutorialProject(project);
    setAppState('tutorial');
  };

  const handleCompleteTutorial = (project: UpcycleProject) => {
    addXp('build', project.title, project.id, undefined, project.difficulty);
    if (analysisResult) {
        setAppState('results');
    } else {
        setAppState('saved');
    }
  };

  const handleSearchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setSearchImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategorySelect = (category: ProjectCategory) => {
    if (category === 'All' || userProfile.isPremium) {
      setCategoryFilter(category);
      playSound('click');
    } else {
      playSound('click'); // Play click sound
      setShowPremiumModal(true);
    }
  };

  // --- Calculate Level Progress ---
  const currentLevelData = LEVELS.find(l => l.level === userProfile.level) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === userProfile.level + 1);
  const minXp = currentLevelData.minXp;
  const nextXp = nextLevelData ? nextLevelData.minXp : minXp * 1.5;
  const progressXP = userProfile.xp - minXp;
  const requiredXP = nextXp - minXp;
  const progressPercent = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
  const xpRemaining = nextXp - userProfile.xp;

  const FilterSelector = () => (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-4">
      <div className="flex gap-2 px-1">
        {PROJECT_CATEGORIES.map((cat) => {
           const isLocked = cat.id !== 'All' && !userProfile.isPremium;
           return (
             <button
               key={cat.id}
               onClick={() => handleCategorySelect(cat.id)}
               className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-1.5 transition-all
                 ${categoryFilter === cat.id 
                   ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-500/40' 
                   : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                 ${isLocked ? 'opacity-80' : ''}
               `}
             >
               <span className="drop-shadow-sm">{cat.icon}</span>
               {cat.label}
               {isLocked && <Lock className="w-3 h-3 text-gray-400" />}
             </button>
           )
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 relative transition-colors duration-300">
      
      {/* Background ambient animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-green-200 dark:bg-green-900 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-200 dark:bg-emerald-900 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-yellow-100 dark:bg-gray-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {levelUpData && (
        <LevelUpOverlay 
          level={levelUpData.level}
          title={levelUpData.title}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handleUpgradeToPremium}
        />
      )}

      {/* Header */}
      {appState !== 'camera' && appState !== 'tutorial' && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 shadow-green-500/30 ring-1 ring-white/20">
              <Recycle className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500 dark:from-green-400 dark:to-emerald-200 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              UpcycleAI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Premium Badge / Button */}
             {userProfile.isPremium ? (
               <div className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full items-center gap-1.5 text-[10px] font-bold text-white shadow-lg ring-1 ring-orange-400 shadow-orange-500/40 animate-pulse">
                 <Crown className="w-3 h-3 fill-white drop-shadow-sm" />
                 PREMIUM
               </div>
             ) : (
               <button 
                onClick={() => setShowPremiumModal(true)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm"
               >
                 FREE
                 <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_5px_rgba(234,179,8,0.8)]"></span>
               </button>
             )}

             {/* Level Indicator with Dropdown */}
             <div className="group relative">
               <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 pl-2 pr-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 cursor-pointer flex items-center gap-2 transition-all hover:shadow-lg shadow-green-500/10 hover:border-green-300 dark:hover:border-green-700">
                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                   {userProfile.level}
                 </div>
                 <div className="flex flex-col leading-none">
                   <span className="text-[10px] font-bold text-green-800 dark:text-green-300 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(34,197,94,0.2)]">{currentLevelData.title}</span>
                 </div>
               </div>

               {/* Hover Dropdown */}
               <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Next: {nextLevelData?.title || "Max Level"}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{Math.floor(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                    {xpRemaining > 0 ? `${xpRemaining} XP to level up!` : "Max Level Reached!"}
                  </p>
                  
                  {/* Triangle Pointer */}
                  <div className="absolute top-0 right-8 -mt-1.5 w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-100 dark:border-gray-700 transform rotate-45"></div>
               </div>
             </div>

             {appState === 'results' && (
                <button 
                onClick={handleScanClick}
                className="hidden sm:block text-xs font-bold text-white bg-green-600 px-4 py-2 rounded-full hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all hover:scale-105"
                >
                New Scan
                </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content with Padding for Fixed Bars */}
      <main className="flex-1 container mx-auto max-w-2xl px-4 relative z-10 pt-24 pb-24 min-h-screen">
        
        {/* Landing State */}
        {appState === 'landing' && (
          <div className="flex flex-col items-center text-center mt-6 animate-fadeIn">
            {/* Daily Quote (Powered by Gemini Flash Lite) */}
            <div className="w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-5 mb-10 border border-green-50 dark:border-gray-700 shadow-sm relative group hover:shadow-lg transition-all duration-500 shadow-green-500/5 hover:border-green-100 dark:hover:border-green-900">
              <div className="absolute -top-3 -left-2 bg-green-100 dark:bg-green-900 rounded-full p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)] ring-2 ring-white dark:ring-gray-800">
                 <Quote className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed drop-shadow-sm">"{dailyQuote}"</p>
            </div>

            <div className="relative w-48 h-48 mb-8 group cursor-pointer" onClick={handleScanClick}>
               <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
               <div className="absolute inset-4 bg-green-300 rounded-full opacity-40 animate-pulse delay-150"></div>
               <img 
                 src="https://picsum.photos/400/400?grayscale" 
                 alt="Recycling Art" 
                 className="absolute inset-0 w-full h-full object-cover rounded-full border-4 border-white dark:border-gray-700 shadow-2xl transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 shadow-green-500/20"
                 style={{ clipPath: 'circle(44% at 50% 50%)' }}
               />
               <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce z-10">
                 <Leaf className="w-8 h-8 text-green-600 drop-shadow-sm" />
               </div>
            </div>

            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Turn Trash into <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">Treasure</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-xs mx-auto leading-relaxed">
              Don't throw it away! Scan any object or search to find creative DIY upcycling projects.
            </p>
            
            <div className="w-full mb-6">
               <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400 px-1 font-semibold drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                  <Sliders className="w-4 h-4" /> Focus Goal
               </div>
               <FilterSelector />
            </div>

            <button
              onClick={handleScanClick}
              className="group relative w-full max-w-xs bg-gray-900 dark:bg-green-600 text-white text-lg font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden mb-4 shadow-green-500/30"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                <Scan className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                Start Scanning
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => setAppState('search')}
              className="w-full max-w-xs bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 text-lg font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-green-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-600"
            >
              <Search className="w-5 h-5 drop-shadow-sm" />
              Search Manually
            </button>
          </div>
        )}

        {/* Search State */}
        {appState === 'search' && (
          <div className="animate-fadeIn">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">What do you have?</h2>
               
               <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400 px-1 font-semibold drop-shadow-sm">
                      <Sliders className="w-4 h-4" /> Focus Goal
                  </div>
                  <FilterSelector />
               </div>

               <div className="relative group">
                 <textarea
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="e.g. Cardboard boxes, old jeans, plastic bottles..."
                   className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 group-hover:border-green-200 dark:group-hover:border-green-800 rounded-xl p-4 pr-12 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-32 shadow-sm transition-all focus:shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                 />
                 <label className="absolute bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors shadow-sm">
                   <CameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                   <input type="file" accept="image/*" onChange={handleSearchFileUpload} className="hidden" />
                 </label>
               </div>
               
               {searchImage && (
                 <div className="mt-2 flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 w-fit animate-slideUp shadow-sm">
                   <span className="text-xs font-bold text-green-600 dark:text-green-400">Image Attached</span>
                   <button onClick={() => setSearchImage(null)}><X className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                 </div>
               )}

               <button 
                 onClick={handleSearchSubmit}
                 disabled={!searchQuery && !searchImage}
                 className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-green-500/30 hover:shadow-green-500/50"
               >
                 <Search className="w-5 h-5 drop-shadow-sm" />
                 Find Ideas
               </button>
             </div>

             <div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 drop-shadow-sm">
                 <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                 Recent History
               </h3>
               <div className="space-y-3">
                 {userProfile.history.filter(h => h.type === 'scan' && h.result).length === 0 ? (
                   <p className="text-gray-400 text-sm text-center py-4">No recent searches</p>
                 ) : (
                    userProfile.history
                    .filter(h => h.type === 'scan' && h.result)
                    .slice().reverse()
                    .map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleHistoryClick(item)}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-green-50 dark:hover:bg-gray-700 transition-colors hover:shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-sm">
                            <Recycle className="w-5 h-5 text-green-600 dark:text-green-400 drop-shadow-sm" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{item.itemName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                      </div>
                    ))
                 )}
               </div>
             </div>
          </div>
        )}

        {/* Camera State */}
        {appState === 'camera' && (
          <Camera 
            onCapture={handleImageCaptured} 
            onClose={() => setAppState('landing')} 
          />
        )}

        {/* Analyzing State */}
        {appState === 'analyzing' && <LoadingOverlay />}

        {/* Tutorial State */}
        {appState === 'tutorial' && activeTutorialProject && (
          <TutorialView 
             project={activeTutorialProject}
             identifiedItem={analysisResult ? analysisResult.identifiedItem : "Item"}
             onClose={() => setAppState(analysisResult ? 'results' : 'saved')}
             onComplete={handleCompleteTutorial}
             isPremium={userProfile.isPremium}
          />
        )}

        {/* Error State */}
        {appState === 'error' && (
           <div className="flex flex-col items-center justify-center mt-20 text-center p-6 animate-fadeIn">
             <div className="bg-red-100 p-4 rounded-full mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
               <Recycle className="w-10 h-10 text-red-500" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analysis Failed</h3>
             <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMsg}</p>
             <button 
               onClick={() => setAppState('landing')}
               className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-800 transition-colors"
             >
               Go Home
             </button>
           </div>
        )}

        {/* Results State */}
        {appState === 'results' && analysisResult && (
          <div className="animate-slideUp">
             <div className="bg-emerald-900 dark:bg-emerald-950 text-white rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden transform transition-all hover:scale-[1.01] shadow-emerald-500/20 border border-emerald-800/50">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
               <div className="relative z-10">
                 <p className="text-emerald-300 font-medium text-sm uppercase tracking-wide mb-1 drop-shadow-sm">Identified</p>
                 <h2 className="text-3xl font-bold capitalize mb-2 drop-shadow-md">{analysisResult.identifiedItem}</h2>
                 <p className="text-emerald-100 text-sm opacity-90">
                   Great find! Here are 5 creative ways to upcycle this.
                 </p>
               </div>
             </div>

             <div className="space-y-4">
               {analysisResult.projects.map((project, index) => (
                 <ProjectCard 
                   key={project.id} 
                   project={project} 
                   identifiedItem={analysisResult.identifiedItem}
                   index={index} 
                   isSaved={savedProjects.some(p => p.id === project.id)}
                   isCompleted={userProfile.completedProjectIds.includes(project.id)}
                   isPremium={userProfile.isPremium}
                   onToggleSave={toggleSaveProject}
                   onUpdateProject={updateActiveProject}
                   onStartTutorial={handleStartTutorial}
                   onShowPremiumModal={() => setShowPremiumModal(true)}
                 />
               ))}
             </div>

             <div className="mt-12 mb-8 text-center">
               <button 
                 onClick={() => setAppState('search')}
                 className="text-green-700 dark:text-green-400 font-bold hover:underline drop-shadow-sm"
               >
                 Search for something else
               </button>
             </div>
          </div>
        )}

        {/* Saved Projects State */}
        {appState === 'saved' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">Saved Projects</h2>
            {savedProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No saved projects yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Scan items to find projects you want to make later.</p>
                <button 
                  onClick={handleScanClick}
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-medium shadow-md shadow-green-500/20 hover:shadow-green-500/40 transition-shadow"
                >
                  Start Scanning
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedProjects.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    identifiedItem={"Saved Item"} 
                    index={index} 
                    isSaved={true}
                    isCompleted={userProfile.completedProjectIds.includes(project.id)}
                    isPremium={userProfile.isPremium}
                    onToggleSave={toggleSaveProject}
                    onUpdateProject={updateActiveProject}
                    onStartTutorial={handleStartTutorial}
                    onShowPremiumModal={() => setShowPremiumModal(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile State */}
        {appState === 'profile' && (
          <ProfileView userProfile={userProfile} onUpdateTheme={updateTheme} />
        )}

      </main>

      {/* Bottom Navigation */}
      {appState !== 'camera' && appState !== 'tutorial' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
           <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
             <button 
               onClick={() => {
                 playSound('click');
                 setAppState('landing');
               }}
               className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${appState === 'landing' ? 'text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
               <Home className="w-6 h-6" />
               <span className="text-[10px] font-medium">Home</span>
             </button>
             
             <button 
               onClick={() => {
                 playSound('click');
                 setAppState('search');
               }}
               className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${appState === 'search' ? 'text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
               <Search className="w-6 h-6" />
               <span className="text-[10px] font-medium">Search</span>
             </button>

             <div className="relative -top-6 group">
                <button 
                  onClick={handleScanClick}
                  className="bg-gray-900 dark:bg-green-600 text-white p-4 rounded-full shadow-xl border-4 border-green-50 dark:border-gray-900 active:scale-95 transition-all shadow-green-500/40 group-hover:shadow-green-500/60 group-hover:-translate-y-1"
                >
                  <Scan className="w-6 h-6 drop-shadow-md" />
                </button>
             </div>

             <button 
               onClick={() => {
                 playSound('click');
                 setAppState('saved');
               }}
               className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${appState === 'saved' ? 'text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
               <Heart className="w-6 h-6" />
               <span className="text-[10px] font-medium">Saved</span>
             </button>

             <button 
               onClick={() => {
                 playSound('click');
                 setAppState('profile');
               }}
               className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${appState === 'profile' ? 'text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
               <User className="w-6 h-6" />
               <span className="text-[10px] font-medium">Profile</span>
             </button>
           </div>
        </nav>
      )}
    </div>
  );
};

export default App;

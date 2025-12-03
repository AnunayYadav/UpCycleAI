
import React, { useState } from 'react';
import { UpcycleProject, StepDetail, GroundedMaterial } from '../types';
import { Clock, BarChart, ChevronDown, ChevronUp, Youtube, ListChecks, Heart, Share2, Sparkles, Loader2, Image as ImageIcon, Bot, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { generateProjectImage, getGroundedMaterialInfo } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { calculateXP } from '../services/gamificationService';

interface ProjectCardProps {
  project: UpcycleProject;
  identifiedItem: string;
  index: number;
  isSaved: boolean;
  isCompleted?: boolean;
  isPremium: boolean;
  onToggleSave: (project: UpcycleProject) => void;
  onUpdateProject: (project: UpcycleProject) => void;
  onStartTutorial: (project: UpcycleProject) => void;
  onShowPremiumModal: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  identifiedItem, 
  index, 
  isSaved,
  isCompleted = false,
  isPremium,
  onToggleSave,
  onUpdateProject,
  onStartTutorial,
  onShowPremiumModal
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);

  const potentialXp = calculateXP('build', project.difficulty);

  const difficultyColor = {
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-[0_0_5px_rgba(34,197,94,0.3)]',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 shadow-[0_0_5px_rgba(234,179,8,0.3)]',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 shadow-[0_0_5px_rgba(239,68,68,0.3)]',
  };

  const handleExpand = async () => {
    playSound('click');
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    if (newExpandedState && !project.generatedImage && !isGeneratingImage) {
      setIsGeneratingImage(true);
      try {
        const base64Image = await generateProjectImage(project.title, identifiedItem, isPremium);
        onUpdateProject({ ...project, generatedImage: base64Image });
        playSound('pop');
      } catch (error) {
        console.error("Failed to generate image", error);
      } finally {
        setIsGeneratingImage(false);
      }
    }
  };

  const handleWatchVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    const query = encodeURIComponent(project.searchQuery);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const handleStartTutorial = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('success');
    onStartTutorial(project);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: `Check out this DIY project: ${project.title}. It transforms ${identifiedItem} into something new!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${project.title}: ${project.description}`);
      alert("Project details copied to clipboard!");
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSaved) playSound('pop');
    onToggleSave(project);
  };

  const handleFindMaterials = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isPremium) {
          onShowPremiumModal();
          return;
      }
      
      if (project.groundedMaterials) return; // Already fetched

      setIsSearchingGrounding(true);
      playSound('click');
      try {
          const groundedData = await getGroundedMaterialInfo(project.materialsNeeded);
          onUpdateProject({ ...project, groundedMaterials: groundedData });
          playSound('success');
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearchingGrounding(false);
      }
  };

  const renderStep = (step: string | StepDetail, i: number) => {
    const instruction = typeof step === 'string' ? step : step.instruction;
    return (
      <li key={i} className="ml-4 text-sm text-gray-700 dark:text-gray-300">
        <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 ring-4 ring-white dark:ring-gray-800 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        {instruction}
      </li>
    );
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${isCompleted ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700'} overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/10 cursor-pointer active:scale-[0.99] relative`}
      onClick={handleExpand}
    >
      {isCompleted && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-xl z-20 shadow-sm flex items-center gap-1 shadow-green-500/50">
          <CheckCircle2 className="w-3.5 h-3.5 drop-shadow-sm" />
          <span className="text-[10px] font-bold uppercase tracking-wider drop-shadow-sm">Completed</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">Option {index + 1}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${difficultyColor[project.difficulty]}`}>
              {project.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 mr-16">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors hover:shadow-[0_0_10px_rgba(0,0,0,0.1)]"
              title="Share Project"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSave}
              className={`p-2 rounded-full transition-all duration-300 ${
                isSaved 
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105' 
                  : 'bg-transparent text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isSaved ? "Remove from Saved" : "Save Project"}
            >
              <Heart className={`w-5 h-5 transition-transform ${isSaved ? 'fill-current scale-110 drop-shadow-sm' : ''}`} />
            </button>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 mr-8 drop-shadow-sm">{project.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {project.timeEstimate}
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="w-3.5 h-3.5" />
            {project.steps.length} Steps
          </div>
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
             <Sparkles className="w-3.5 h-3.5" />
             +{potentialXp} XP
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4 animate-fadeIn">
            
            <div className="mb-6 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 relative min-h-[200px] flex items-center justify-center group shadow-inner transition-colors hover:border-green-200 dark:hover:border-green-900">
              {project.generatedImage ? (
                <img 
                  src={`data:image/jpeg;base64,${project.generatedImage}`} 
                  alt={project.title} 
                  className="w-full h-full object-cover animate-fadeIn transition-transform duration-700 group-hover:scale-105"
                />
              ) : isGeneratingImage ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white drop-shadow-sm">Visualizing result...</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Generating a {isPremium ? "High-Res" : "Standard"} preview</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 p-6">
                  <ImageIcon className="w-8 h-8 opacity-50 drop-shadow-sm" />
                  <span className="text-xs">Image failed to load</span>
                </div>
              )}
              
              {project.generatedImage && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" /> AI Generated
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 drop-shadow-sm">
                    <ListChecks className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Materials Needed
                </h4>
                <button 
                    onClick={handleFindMaterials}
                    disabled={isSearchingGrounding}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 transition-all shadow-sm
                        ${isPremium 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}
                    `}
                >
                    {isSearchingGrounding ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3" />}
                    {isPremium ? "Find Online" : "PRO: Find Online"}
                </button>
              </div>

              {/* Grounded Results */}
              {project.groundedMaterials && (
                  <div className="mb-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30 animate-fadeIn shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 drop-shadow-sm">Verified Sources:</p>
                      <div className="space-y-1.5">
                          {project.groundedMaterials.map((gm, k) => (
                              <a key={k} href={gm.searchUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-xs hover:bg-white/50 p-1 rounded transition-colors group">
                                  <ExternalLink className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                                  <div className="min-w-0">
                                      <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{gm.material}</p>
                                      <p className="text-gray-500 dark:text-gray-400 truncate text-[10px]">{gm.snippet}</p>
                                  </div>
                              </a>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex flex-wrap gap-2">
                {project.materialsNeeded.map((mat, i) => (
                  <span key={i} className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 drop-shadow-sm">Instructions</h4>
              <ol className="space-y-3 relative border-l-2 border-green-100 dark:border-green-900 ml-2">
                {project.steps.map((step, i) => renderStep(step, i))}
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleStartTutorial}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 dark:from-green-700 dark:to-emerald-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all shadow-green-500/20 hover:shadow-green-500/40"
              >
                <Bot className="w-5 h-5 text-green-400 dark:text-white drop-shadow-sm" />
                <span className="drop-shadow-sm">Start AI Assisted Tutorial</span>
              </button>
              
              <button 
                onClick={handleWatchVideo}
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <Youtube className="w-5 h-5 drop-shadow-sm" />
                Find Video Tutorial
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-2 flex justify-center border-t border-gray-100 dark:border-gray-700">
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-green-600 dark:hover:text-green-400 transition-colors">
             View Instructions & Visualization <ChevronDown className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;


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
  project, identifiedItem, index, isSaved, isCompleted = false, isPremium,
  onToggleSave, onUpdateProject, onStartTutorial, onShowPremiumModal
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const potentialXp = calculateXP('build', project.difficulty);

  const diffStyles = {
    Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const handleToggle = async () => {
    playSound('click');
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState && !project.generatedImage && !isGeneratingImage) {
      setIsGeneratingImage(true);
      try {
        const img = await generateProjectImage(project.title, identifiedItem, isPremium);
        onUpdateProject({ ...project, generatedImage: img });
      } catch (e) { console.error(e); }
      finally { setIsGeneratingImage(false); }
    }
  };

  return (
    <div 
      className={`bg-midnight-card rounded-3xl border transition-all duration-500 overflow-hidden cursor-pointer active:scale-[0.99]
        ${isCompleted ? 'border-emerald-500/30' : 'border-white/5 hover:border-white/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]'}
      `}
      onClick={handleToggle}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${diffStyles[project.difficulty]}`}>
              {project.difficulty}
            </span>
            {isCompleted && <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500 text-black">DONE</span>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onToggleSave(project); playSound('pop'); }} 
                  className={`p-2 rounded-2xl transition-all ${isSaved ? 'text-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-500 hover:text-white'}`}>
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <h3 className="text-xl font-black text-white mb-2 leading-tight">{project.title}</h3>
        <p className="text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed">{project.description}</p>

        <div className="flex items-center gap-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
           <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {project.timeEstimate}</div>
           <div className="flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5" /> {project.steps.length} STEPS</div>
           <div className="flex items-center gap-1.5 text-emerald-500"><Sparkles className="w-3.5 h-3.5" /> +{potentialXp} XP</div>
        </div>

        {isExpanded && (
          <div className="mt-8 space-y-8 animate-fadeIn">
            <div className="aspect-video rounded-2xl bg-black border border-white/5 overflow-hidden flex items-center justify-center relative group">
              {project.generatedImage ? (
                <img src={`data:image/jpeg;base64,${project.generatedImage}`} alt={project.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-600">
                  {isGeneratingImage ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <ImageIcon className="w-8 h-8 opacity-30" />}
                  <span className="text-[10px] font-black tracking-widest uppercase">{isGeneratingImage ? "Crafting Visualization..." : "Visual Failed"}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> The Toolkit
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.materialsNeeded.map((m, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 text-xs font-medium text-gray-300 rounded-xl">{m}</span>
                ))}
              </div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); onStartTutorial(project); }} 
              className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              <Bot className="w-5 h-5" /> START TUTORIAL
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(project.searchQuery)}`, '_blank'); }}
              className="w-full py-4 bg-midnight-card text-gray-400 font-bold rounded-2xl border border-white/5 hover:text-white transition-colors flex items-center justify-center gap-3">
              <Youtube className="w-5 h-5" /> WATCH ON YOUTUBE
            </button>
          </div>
        )}
      </div>

      <div className="py-2 flex justify-center border-t border-white/5 opacity-50">
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
    </div>
  );
};

export default ProjectCard;

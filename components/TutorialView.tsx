
import React, { useState, useEffect, useRef } from 'react';
import { UpcycleProject, StepDetail } from '../types';
import { ArrowLeft, ChevronRight, ChevronLeft, Sparkles, Loader2, CheckCircle, AlertTriangle, Lightbulb, Info, RefreshCw, ImageOff, Volume2, Pause, X } from 'lucide-react';
import { generateStepImage, generateSpeech } from '../services/geminiService';
import { playSound, playPCM } from '../services/soundService';

interface TutorialViewProps {
  project: UpcycleProject;
  identifiedItem: string;
  onClose: () => void;
  onComplete: (project: UpcycleProject) => void;
  isPremium: boolean;
}

const TutorialView: React.FC<TutorialViewProps> = ({ project, identifiedItem, onClose, onComplete, isPremium }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Audio State
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Normalize steps to ensure they are StepDetail objects
  const steps: StepDetail[] = typeof project.steps[0] === 'string' 
    ? (project.steps as string[]).map((s, i) => ({
        title: `Step ${i + 1}`,
        instruction: s,
        detailedDescription: "Follow the instruction carefully to ensure the best result.",
        tip: "Take your time with this step.",
        caution: "Be careful when using tools."
      }))
    : (project.steps as StepDetail[]);

  const generateVisual = async (forceRetry = false) => {
    if (stepImages[currentStep] && !forceRetry) return;
    
    setLoadingImage(true);
    setImageError(false);
    try {
      const base64 = await generateStepImage(
        steps[currentStep].instruction,
        project.title,
        identifiedItem,
        isPremium
      );
      setStepImages(prev => ({ ...prev, [currentStep]: base64 }));
    } catch (e) {
      console.error("Visual generation failed:", e);
      setImageError(true);
    } finally {
      setLoadingImage(false);
    }
  };

  // Stop audio when unmounting or changing steps
  useEffect(() => {
    return () => {
        if (stopAudioRef.current) {
            stopAudioRef.current();
            stopAudioRef.current = null;
        }
        setIsPlaying(false);
    };
  }, [currentStep]); // Also triggers when step changes

  useEffect(() => {
    const timer = setTimeout(() => {
        generateVisual();
    }, 500);

    return () => {
        clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]); 

  const handleReadAloud = async () => {
      // If currently playing, stop it
      if (isPlaying) {
          if (stopAudioRef.current) {
              stopAudioRef.current();
              stopAudioRef.current = null;
          }
          setIsPlaying(false);
          return;
      }
      
      if (isAudioLoading) return;

      const step = steps[currentStep];
      const textToRead = `${step.title}. ${step.instruction}. ${step.detailedDescription}. Tip: ${step.tip}`;

      try {
          setIsAudioLoading(true);
          let audioData = audioCache[currentStep];

          if (!audioData) {
              // Fetch from API
              audioData = await generateSpeech(textToRead);
              setAudioCache(prev => ({ ...prev, [currentStep]: audioData }));
          }

          setIsAudioLoading(false);
          setIsPlaying(true);
          
          // Play using PCM decoder and store stop function
          const controller = playPCM(audioData, () => {
              setIsPlaying(false);
              stopAudioRef.current = null;
          });
          
          stopAudioRef.current = controller.stop;

      } catch (e) {
          console.error("Audio Playback Error", e);
          setIsAudioLoading(false);
          setIsPlaying(false);
      }
  };

  const handleBack = () => {
    playSound('click');
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      playSound('pop');
      setCurrentStep(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      playSound('pop');
      setCurrentStep(curr => curr - 1);
    }
  };
  
  const handleFinish = () => {
      playSound('success');
      onComplete(project);
  };

  const handleRetryImage = () => {
    generateVisual(true);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-slideUp">
      {/* Header - Fixed within Modal */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm z-50 sticky top-0">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors shadow-gray-200/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
          <ArrowLeft className="w-6 h-6 drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[200px] drop-shadow-[0_0_8px_rgba(34,197,94,0.1)]">{project.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Step {currentStep + 1} of {steps.length}</p>
        </div>
        <button 
            onClick={handleReadAloud}
            disabled={isAudioLoading}
            className={`p-2 rounded-full transition-all duration-300 ${
                isPlaying 
                ? 'bg-green-100 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse' 
                : isAudioLoading
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]'
            }`}
        >
            {isAudioLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 text-green-500" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 relative z-40">
        <div 
          className="bg-green-600 h-1.5 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(34,197,94,0.8)]"
          style={{ width: `${progress}%` }}
        ></div>
        <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px] animate-pulse" style={{ left: `${progress}%`, transition: 'left 0.3s ease-out' }}></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-36 flex flex-col items-center">
        
        {/* Step Visualizer */}
        <div className="w-full aspect-video bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 mb-8 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group transition-all hover:border-green-200 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] min-h-[250px] shrink-0">
          {stepImages[currentStep] ? (
            <img 
              src={`data:image/jpeg;base64,${stepImages[currentStep]}`} 
              alt={`Step ${currentStep + 1}`} 
              className="w-full h-full object-cover animate-fadeIn"
            />
          ) : (
            <div className="text-center p-6 w-full h-full flex items-center justify-center absolute inset-0">
               {loadingImage ? (
                 <div className="flex flex-col items-center gap-3">
                   <Loader2 className="w-10 h-10 text-green-600 animate-spin drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400 drop-shadow-sm">AI Visualizing Step...</p>
                 </div>
               ) : imageError ? (
                  <div className="flex flex-col items-center gap-3">
                    <ImageOff className="w-8 h-8 text-red-300 drop-shadow-[0_0_5px_rgba(252,165,165,0.5)]" />
                    <p className="text-sm text-red-400">Visualization unavailable</p>
                    <button 
                      onClick={handleRetryImage}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3" /> Try Again
                    </button>
                  </div>
               ) : (
                 <div className="flex flex-col items-center gap-2 opacity-50">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-400">Loading visualization...</p>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Step Text */}
        <div className="w-full max-w-lg space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="flex-shrink-0 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                {currentStep + 1}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider drop-shadow-sm">{currentStepData.title}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {currentStepData.instruction}
            </h2>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-200 text-sm leading-relaxed border-l-4 border-gray-300 dark:border-gray-600 shadow-sm">
             <div className="flex items-center gap-2 mb-1 font-semibold text-gray-900 dark:text-white drop-shadow-sm">
                <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Description
             </div>
             {currentStepData.detailedDescription}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-200 text-sm border-l-4 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <div className="flex items-center gap-2 mb-1 font-semibold drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]">
                <Lightbulb className="w-4 h-4" /> Pro Tip
             </div>
             {currentStepData.tip}
          </div>

          {currentStepData.caution && (
             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-orange-800 dark:text-orange-200 text-sm border-l-4 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <div className="flex items-center gap-2 mb-1 font-semibold drop-shadow-[0_0_5px_rgba(249,115,22,0.3)]">
                    <AlertTriangle className="w-4 h-4" /> Caution
                 </div>
                 {currentStepData.caution}
             </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
         <div className="max-w-md mx-auto flex gap-4">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                currentStep === 0 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Prev
            </button>
            
            {currentStep === steps.length - 1 ? (
                <button 
                    onClick={handleFinish}
                    className="flex-[2] py-3 bg-gray-900 dark:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform shadow-green-500/30 hover:shadow-green-500/50"
                >
                    <CheckCircle className="w-5 h-5 text-green-400 dark:text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                    Complete Build
                </button>
            ) : (
                <button 
                onClick={handleNext}
                className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-green-700 active:scale-95 transition-all shadow-green-500/30 hover:shadow-green-500/50"
                >
                Next
                <ChevronRight className="w-5 h-5 drop-shadow-sm" />
                </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default TutorialView;

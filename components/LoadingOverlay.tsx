
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-200 dark:bg-green-800 rounded-full animate-ping opacity-20"></div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl relative z-10 border-2 border-green-100 dark:border-green-900">
          <Sparkles className="w-12 h-12 text-green-600 dark:text-green-400 animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analyzing your Item...</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs animate-pulse">
        Our AI is scanning the shape and material to find the best upcycling projects for you.
      </p>
      
      <div className="mt-8 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/50 px-4 py-2 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
        Processing trash to treasure
      </div>
    </div>
  );
};

export default LoadingOverlay;

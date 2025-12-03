import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, X, RefreshCw, Sparkles, Send } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string, userPrompt?: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  // Preview State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');

  useEffect(() => {
    // Only start camera if we are NOT in preview mode
    if (capturedImage) {
      if (stream) {
         stream.getTracks().forEach(track => track.stop());
         setStream(null);
      }
      return;
    }

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer back camera
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]); // Re-run when capture state changes

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get base64 string without data prefix for API
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1]; 
        
        setCapturedImage(base64Data);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setCapturedImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUserPrompt('');
  };

  const handleAnalyze = () => {
    if (capturedImage) {
      onCapture(capturedImage, userPrompt);
    }
  };

  // Preview Mode UI
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col h-full animate-fadeIn">
         <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <img 
              src={`data:image/jpeg;base64,${capturedImage}`} 
              alt="Captured" 
              className="w-full h-full object-contain opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>
            
            <button 
              onClick={handleRetake} 
              className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-md z-10"
            >
              <X className="w-6 h-6" />
            </button>
         </div>

         <div className="bg-white rounded-t-3xl p-6 -mt-6 relative z-10 shadow-xl pb-safe">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Add Details (Optional)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tell us what you want to make, or list other materials you have (e.g., "I have blue paint and glue").
            </p>
            
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g. Make something for my garden..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24 mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={handleRetake}
                className="flex-1 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Retake
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-[2] py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Generate Ideas
              </button>
            </div>
         </div>
      </div>
    );
  }

  // Camera Mode UI
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-4">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-white py-4 px-2">
        <h2 className="text-lg font-semibold">Scan Item</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {!error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white text-center p-4">
            {error}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Guides */}
        <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-lg pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 -mt-0.5 -ml-0.5"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 -mt-0.5 -mr-0.5"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 -mb-0.5 -ml-0.5"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 -mb-0.5 -mr-0.5"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col items-center gap-4 pb-8">
        <button
          onClick={handleCapture}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)] active:scale-90 transition-transform"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
             <CameraIcon className="w-8 h-8 text-white" />
          </div>
        </button>
        <div className="text-white text-sm opacity-80">
          Or upload a photo
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload}
            className="ml-2 text-transparent w-24 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
      </div>
    </div>
  );
};

export default Camera;
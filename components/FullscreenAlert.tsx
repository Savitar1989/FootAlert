
import React, { useEffect } from 'react';
import { X, Trophy, Siren } from 'lucide-react';

interface FullscreenAlertProps {
  title: string;
  message: string;
  type: 'success' | 'alert'; // Success = Won Bet, Alert = Strategy Hit
  onClose: () => void;
}

export const FullscreenAlert: React.FC<FullscreenAlertProps> = ({ title, message, type, onClose }) => {
  
  // Auto close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in zoom-in duration-300 cursor-pointer" onClick={onClose}>
      {/* Animated Background Glow */}
      <div className={`absolute inset-0 opacity-20 animate-pulse-slow ${isSuccess ? 'bg-emerald-500' : 'bg-brand-500'}`}></div>
      
      <div className="relative z-10 text-center p-8 max-w-2xl w-full mx-4">
        
        {/* Icon */}
        <div className="flex justify-center mb-8">
           <div className={`p-8 rounded-full border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isSuccess ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-brand-500/20 border-brand-500 text-brand-400'} animate-bounce`}>
             {isSuccess ? <Trophy size={80} strokeWidth={1.5} /> : <Siren size={80} strokeWidth={1.5} />}
           </div>
        </div>

        {/* Big Title */}
        <h1 className={`text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 drop-shadow-2xl ${isSuccess ? 'text-white' : 'text-white'}`}>
          {title}
        </h1>
        
        {/* Message */}
        <div className={`text-2xl md:text-3xl font-bold font-mono border-t-2 border-b-2 py-6 ${isSuccess ? 'text-emerald-400 border-emerald-500/30' : 'text-brand-400 border-brand-500/30'}`}>
          {message}
        </div>

        <p className="mt-8 text-slate-500 uppercase tracking-[0.2em] text-sm font-bold animate-pulse">
          Tap anywhere to dismiss
        </p>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-0 right-0 p-4 text-slate-500 hover:text-white transition-colors">
          <X size={32} />
        </button>
      </div>
    </div>
  );
};

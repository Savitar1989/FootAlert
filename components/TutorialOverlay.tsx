
import React, { useState } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to FootAlert!",
      text: "Let's get you set up to beat the bookies. This tool helps you automate your betting analysis.",
      position: "center"
    },
    {
      title: "Live Dashboard",
      text: "The 'Live' tab shows all matches currently in play. Click any match to see advanced stats like xG and Dangerous Attacks.",
      position: "bottom-left" // Positioning logic would be more complex in real app, simplified here
    },
    {
      title: "Strategy Builder",
      text: "Go to 'Strats' to build your own alerts. Combine metrics like 'Time > 70' and '0-0 Score' to find late goals.",
      position: "bottom-center"
    },
    {
      title: "Marketplace",
      text: "Check the 'Store' to download strategies created by top users if you don't want to build your own.",
      position: "bottom-right"
    }
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-brand-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-indigo-500"></div>
        
        <div className="flex justify-between items-start mb-6">
           <h3 className="text-xl font-bold text-white">{current.title}</h3>
           <button onClick={onComplete} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
          {current.text}
        </p>

        <div className="flex justify-between items-center">
           <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
              ))}
           </div>
           <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors">
              {step === steps.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
           </button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Radio, Zap } from 'lucide-react';

export const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48;
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-4xl';
  const gap = size === 'sm' ? 'gap-1.5' : 'gap-2';

  return (
    <div className={`flex items-center ${gap} font-sans`}>
      <div className="relative">
        <div className={`bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 ${size === 'xl' ? 'p-3' : 'p-1.5'}`}>
           <Radio size={iconSize} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-800">
           <Zap size={iconSize * 0.4} className="text-yellow-400 fill-yellow-400" />
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-tight text-white ${textSize}`}>
          Foot<span className="text-brand-400">Alert</span>
        </span>
      </div>
    </div>
  );
};

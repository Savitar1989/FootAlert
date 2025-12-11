
import React, { useState } from 'react';
import { Match } from '../types';
import { analyzeMatch } from '../services/geminiService';
import { Bot, Target, Flag, Zap, ChevronDown, ChevronUp, History, Clock, Activity } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analysis) return;
    setLoadingAnalysis(true);
    setExpanded(true);
    const result = await analyzeMatch(match);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const isLive = match.status === 'Live';

  // Helper to render stats row with N/A support
  const formatValue = (val: number | null | string, suffix = '') => {
    if (val === null || val === undefined) return <span className="text-slate-600 font-mono">-</span>;
    return <span>{val}{suffix}</span>;
  };

  const StatRow = ({ label, home, away, highlight = false, unit = '' }: { label: string, home: number | string | null, away: number | string | null, highlight?: boolean, unit?: string }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
       <div className={`w-12 text-right font-mono text-xs ${highlight ? 'text-brand-300 font-bold' : 'text-slate-300'}`}>
         {formatValue(home, unit)}
       </div>
       <div className="flex-1 text-center text-[10px] text-slate-500 uppercase font-bold tracking-wider px-2">{label}</div>
       <div className={`w-12 text-left font-mono text-xs ${highlight ? 'text-brand-300 font-bold' : 'text-slate-300'}`}>
         {formatValue(away, unit)}
       </div>
    </div>
  );

  return (
    <div 
      className={`relative glass-card rounded-xl overflow-hidden transition-all duration-300 mb-4 group ${expanded ? 'ring-1 ring-brand-500/30' : 'hover:ring-1 hover:ring-slate-600'}`}
    >
      {/* Glow Effect on Live */}
      {isLive && <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>}

      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header: League & Time */}
        <div className="flex justify-between items-center text-xs mb-4 pl-3">
          <div className="flex items-center gap-2 text-slate-400">
             <span className="font-bold text-slate-200 tracking-tight">{match.country}</span>
             <span className="text-slate-600">/</span>
             <span className="truncate max-w-[150px]">{match.league}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isLive ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {isLive ? (
               <>
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                 </span>
                 <span className="font-mono font-bold text-xs">{match.minute}'</span>
               </>
            ) : (
               <>
                 <Clock size={12} />
                 <span className="font-medium text-[10px] uppercase">{new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
               </>
            )}
          </div>
        </div>

        {/* Teams & Score - Modern Layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4 pl-3">
          {/* Home */}
          <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 p-2 shadow-inner">
                {match.homeLogo ? <img src={match.homeLogo} className="w-full h-full object-contain" alt="" /> : <div className="text-[10px] font-bold text-slate-600">H</div>}
             </div>
             <span className="text-sm font-bold text-white text-center leading-tight">{match.homeTeam}</span>
          </div>
          
          {/* Score Board */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-slate-950 px-5 py-2 rounded-lg border border-slate-800 text-3xl font-mono font-bold text-white tracking-widest shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
               {match.stats.home.goals}<span className="text-slate-600 mx-1">:</span>{match.stats.away.goals}
            </div>
            {isLive && match.stats.liveOdds && (
               <div className="flex gap-2 mt-2 text-[10px] font-mono text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-brand-400">1: {match.stats.liveOdds.homeWin}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-orange-400">2: {match.stats.liveOdds.awayWin}</span>
               </div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 p-2 shadow-inner">
                {match.awayLogo ? <img src={match.awayLogo} className="w-full h-full object-contain" alt="" /> : <div className="text-[10px] font-bold text-slate-600">A</div>}
             </div>
             <span className="text-sm font-bold text-white text-center leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* Quick Stats Micro-Bar */}
        <div className="grid grid-cols-3 gap-px bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden mx-2">
           <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40">
             <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Target size={10} /> Shots OT</div>
             <div className="text-xs font-mono text-white">
               <span className={match.stats.home.shotsOnTarget! > match.stats.away.shotsOnTarget! ? 'text-brand-400 font-bold' : ''}>{match.stats.home.shotsOnTarget || 0}</span>
               <span className="text-slate-600 mx-1">-</span>
               <span className={match.stats.away.shotsOnTarget! > match.stats.home.shotsOnTarget! ? 'text-brand-400 font-bold' : ''}>{match.stats.away.shotsOnTarget || 0}</span>
             </div>
           </div>
           <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40">
             <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Flag size={10} /> Corners</div>
             <div className="text-xs font-mono text-white">
               <span className={match.stats.home.corners! > match.stats.away.corners! ? 'text-blue-400 font-bold' : ''}>{match.stats.home.corners || 0}</span>
               <span className="text-slate-600 mx-1">-</span>
               <span className={match.stats.away.corners! > match.stats.home.corners! ? 'text-blue-400 font-bold' : ''}>{match.stats.away.corners || 0}</span>
             </div>
           </div>
           <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40">
             <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Zap size={10} /> Attacks</div>
             <div className="text-xs font-mono text-white">
               <span className={match.stats.home.dangerousAttacks! > match.stats.away.dangerousAttacks! ? 'text-orange-400 font-bold' : ''}>{match.stats.home.dangerousAttacks || 0}</span>
               <span className="text-slate-600 mx-1">-</span>
               <span className={match.stats.away.dangerousAttacks! > match.stats.home.dangerousAttacks! ? 'text-orange-400 font-bold' : ''}>{match.stats.away.dangerousAttacks || 0}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-slate-950/30 border-t border-slate-800/50 px-4 py-4 backdrop-blur-md">
           
           <div className="grid md:grid-cols-2 gap-6">
              {/* In-Play Column */}
              <div>
                <h4 className="text-[10px] uppercase font-bold text-brand-500/70 mb-3 flex items-center gap-1">
                   <Activity size={12} className="animate-pulse" /> Live Metrics
                </h4>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    <StatRow label="Possession" home={match.stats.home.possession} away={match.stats.away.possession} unit="%" />
                    <StatRow label="Expected Goals (xG)" home={match.stats.home.expectedGoals} away={match.stats.away.expectedGoals} highlight />
                    <StatRow label="Shots Off Target" home={match.stats.home.shotsOffTarget} away={match.stats.away.shotsOffTarget} />
                    <StatRow label="Cards (Y/R)" home={`${match.stats.home.yellowCards || 0}/${match.stats.home.redCards || 0}`} away={`${match.stats.away.yellowCards || 0}/${match.stats.away.redCards || 0}`} />
                </div>
              </div>

              {/* Pre-Match Column */}
              <div>
                <h4 className="text-[10px] uppercase font-bold text-indigo-500/70 mb-3 flex items-center gap-1 mt-4 md:mt-0">
                   <History size={12} /> Historical Data
                </h4>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    <StatRow label="Form (Last 5)" home={match.preMatch.home.last5Form} away={match.preMatch.away.last5Form} highlight />
                    <StatRow label="PPG" home={match.preMatch.home.ppg} away={match.preMatch.away.ppg} />
                    <StatRow label="Avg Goals Scored" home={match.preMatch.home.avgGoalsScored} away={match.preMatch.away.avgGoalsScored} />
                    <StatRow label="BTTS %" home={match.preMatch.home.bttsPercentage} away={match.preMatch.away.bttsPercentage} unit="%" />
                </div>
              </div>
           </div>

           {/* AI Section */}
           <div className="mt-4 pt-4 border-t border-slate-800/50">
             {!analysis && !loadingAnalysis && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full py-3 bg-gradient-to-r from-brand-900 to-indigo-900 hover:from-brand-800 hover:to-indigo-800 border border-brand-500/20 text-brand-100 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20 group"
                >
                  <Bot size={16} className="group-hover:animate-bounce" /> REQUEST AI ANALYSIS
                </button>
             )}

             {loadingAnalysis && (
               <div className="p-4 bg-slate-900/50 rounded-lg border border-brand-500/20 flex flex-col items-center gap-2">
                 <Bot size={24} className="text-brand-400 animate-spin" />
                 <span className="text-xs text-brand-300 font-medium animate-pulse">Analyzing tactical patterns...</span>
               </div>
             )}

             {analysis && (
               <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-950/40 border border-indigo-500/30 rounded-lg shadow-inner">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                        <Bot size={14} /> Gemini Analyst
                    </div>
                    <span className="text-[10px] text-indigo-500/50 font-mono">{new Date().toLocaleTimeString()}</span>
                 </div>
                 <p className="text-sm text-slate-300 leading-relaxed font-light">{analysis}</p>
               </div>
             )}
           </div>
        </div>
      )}
      
      {/* Toggle Handle */}
      <div 
        className="h-4 flex items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
      </div>
    </div>
  );
};

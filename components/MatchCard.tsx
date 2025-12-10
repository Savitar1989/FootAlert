
import React, { useState } from 'react';
import { Match } from '../types';
import { analyzeMatch } from '../services/geminiService';
import { Bot, Target, Flag, Zap, ChevronDown, ChevronUp, History, TrendingUp } from 'lucide-react';

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
    if (val === null || val === undefined) return <span className="text-slate-600 font-mono">N/A</span>;
    return <span>{val}{suffix}</span>;
  };

  const StatRow = ({ label, home, away, highlight = false, unit = '' }: { label: string, home: number | string | null, away: number | string | null, highlight?: boolean, unit?: string }) => (
    <>
      <div className={`text-right ${highlight ? 'text-white font-bold' : 'text-slate-400'}`}>
        {formatValue(home, unit)}
      </div>
      <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">{label}</div>
      <div className={`text-left ${highlight ? 'text-white font-bold' : 'text-slate-400'}`}>
        {formatValue(away, unit)}
      </div>
    </>
  );

  return (
    <div className={`bg-slate-800/80 backdrop-blur-sm border ${isLive ? 'border-brand-500/50' : 'border-slate-700'} rounded-xl shadow-lg mb-3 overflow-hidden transition-all duration-200`}>
      <div 
        className="p-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header: League & Time */}
        <div className="flex justify-between items-center text-xs mb-3">
          <div className="flex items-center gap-2 text-slate-400 truncate max-w-[70%]">
             <span className="font-bold text-slate-300">{match.country}</span>
             <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
             <span className="truncate">{match.league}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isLive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-700 text-slate-400'}`}>
            {isLive && <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>}
            <span className="font-bold text-[10px] uppercase tracking-wide">
              {isLive ? `${match.minute}'` : match.status}
            </span>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
          <div className="flex flex-col items-center gap-2 text-center">
             {match.homeLogo ? <img src={match.homeLogo} className="w-8 h-8 object-contain" alt="" /> : <div className="w-8 h-8 bg-slate-700 rounded-full"></div>}
             <span className="text-sm font-bold text-white leading-tight">{match.homeTeam}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="px-4 py-1 bg-slate-950 rounded-lg border border-slate-700 text-2xl font-bold text-white font-mono tracking-widest shadow-inner">
              {match.stats.home.goals}-{match.stats.away.goals}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
             {match.awayLogo ? <img src={match.awayLogo} className="w-8 h-8 object-contain" alt="" /> : <div className="w-8 h-8 bg-slate-700 rounded-full"></div>}
             <span className="text-sm font-bold text-white leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-700/50">
           <div className="flex flex-col items-center gap-1 border-r border-slate-700/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Flag size={10} /> Corners</div>
             <div className="text-xs font-mono text-brand-400 font-bold">
               {formatValue(match.stats.home.corners)} - {formatValue(match.stats.away.corners)}
             </div>
           </div>
           <div className="flex flex-col items-center gap-1 border-r border-slate-700/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Target size={10} /> Shots OT</div>
             <div className="text-xs font-mono text-white font-bold">
               {formatValue(match.stats.home.shotsOnTarget)} - {formatValue(match.stats.away.shotsOnTarget)}
             </div>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Zap size={10} /> Attacks</div>
             <div className="text-xs font-mono text-orange-400 font-bold">
               {formatValue(match.stats.home.dangerousAttacks)} - {formatValue(match.stats.away.dangerousAttacks)}
             </div>
           </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-4">
           {/* Live Stats Table */}
           <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">In-Play Stats</h4>
           <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 text-xs mb-4 items-center text-center">
              <StatRow label="Possession" home={match.stats.home.possession} away={match.stats.away.possession} unit="%" />
              <StatRow label="Expected Goals (xG)" home={match.stats.home.expectedGoals} away={match.stats.away.expectedGoals} highlight />
              <StatRow label="Shots Off Target" home={match.stats.home.shotsOffTarget} away={match.stats.away.shotsOffTarget} />
              <StatRow label="Dangerous Attacks" home={match.stats.home.dangerousAttacks} away={match.stats.away.dangerousAttacks} />
              <StatRow label="Cards (Y/R)" home={`${match.stats.home.yellowCards || 0}/${match.stats.home.redCards || 0}`} away={`${match.stats.away.yellowCards || 0}/${match.stats.away.redCards || 0}`} />
           </div>

           {/* Pre-Match Stats Table */}
           <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-4 flex items-center gap-1"><History size={10}/> Season Form & History</h4>
           <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 text-xs mb-4 items-center text-center bg-slate-800/30 p-2 rounded-lg">
              <StatRow label="Form (Last 5)" home={match.preMatch.home.last5Form} away={match.preMatch.away.last5Form} highlight />
              <StatRow label="Avg Goals Scored" home={match.preMatch.home.avgGoalsScored} away={match.preMatch.away.avgGoalsScored} />
              <StatRow label="Avg Goals Conceded" home={match.preMatch.home.avgGoalsConceded} away={match.preMatch.away.avgGoalsConceded} />
           </div>

           {/* AI Section */}
           <div className="mt-4 pt-4 border-t border-slate-800">
             {!analysis && !loadingAnalysis && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/50"
                >
                  <Bot size={16} /> ANALYZE MATCH DYNAMICS
                </button>
             )}

             {loadingAnalysis && (
               <div className="p-4 bg-slate-900 rounded-lg border border-indigo-500/20 animate-pulse flex flex-col items-center gap-2">
                 <Bot size={24} className="text-indigo-400 animate-bounce" />
                 <span className="text-xs text-indigo-300 font-medium">Crunching live numbers...</span>
               </div>
             )}

             {analysis && (
               <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                        <Bot size={14} /> AI Analyst
                    </div>
                    <span className="text-[10px] text-indigo-500/50">{new Date().toLocaleTimeString()}</span>
                 </div>
                 <p className="text-sm text-indigo-100 leading-relaxed font-light">{analysis}</p>
               </div>
             )}
           </div>
        </div>
      )}
      
      {/* Toggle Handle */}
      <div 
        className="h-5 flex items-center justify-center bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-colors"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        {expanded ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
      </div>
    </div>
  );
};

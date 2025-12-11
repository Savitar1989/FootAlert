
import React from 'react';
import { BetTicket, TargetOutcome } from '../types';
import { X, Clock, Target, Activity, DollarSign, Trophy } from 'lucide-react';

interface AlertDetailsModalProps {
  ticket: BetTicket;
  onClose: () => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({ ticket, onClose }) => {
  const stats = ticket.statsSnapshot;
  const preOdds = ticket.preMatchOdds;

  // Helper for comparison bars
  const StatBar = ({ label, hVal, aVal }: { label: string, hVal: number | null, aVal: number | null }) => {
    const h = hVal || 0;
    const a = aVal || 0;
    const total = h + a;
    const hPct = total > 0 ? (h / total) * 100 : 50;

    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="font-mono font-bold text-white">{h}</span>
          <span className="uppercase font-bold tracking-wider text-[10px]">{label}</span>
          <span className="font-mono font-bold text-white">{a}</span>
        </div>
        <div className="flex h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div style={{ width: `${hPct}%` }} className="bg-brand-500"></div>
          <div className="flex-1 bg-indigo-500"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-indigo-500"></div>
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
           </button>

           <div className="flex justify-center items-center gap-6 mb-4 mt-2">
              <div className="text-center w-1/3">
                 <div className="text-lg font-bold text-white leading-tight">{ticket.homeTeam}</div>
              </div>
              <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-2xl font-mono font-bold text-white shadow-inner">
                 {ticket.initialScore.home}-{ticket.initialScore.away}
              </div>
              <div className="text-center w-1/3">
                 <div className="text-lg font-bold text-white leading-tight">{ticket.awayTeam}</div>
              </div>
           </div>

           <div className="flex justify-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-brand-400 font-bold bg-brand-500/10 px-2.5 py-1 rounded border border-brand-500/20">
                 <Clock size={12} />
                 <span>Triggered: {new Date(ticket.triggerTime).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                 <Activity size={12} />
                 <span>Strategy: {ticket.strategyName}</span>
              </div>
           </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
           
           {/* Target & Odds */}
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                 <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Target size={10} /> Target Outcome</div>
                 <div className="text-sm font-bold text-brand-400">{ticket.targetOutcome}</div>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                 <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><DollarSign size={10} /> Live Odds (Target)</div>
                 <div className="text-sm font-bold text-white">{ticket.oddsAtTrigger}</div>
              </div>
           </div>

           {/* Stats Snapshot */}
           {stats ? (
              <div className="mb-6">
                 <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity size={12} className="text-slate-500" /> Stats at Trigger Time
                 </h4>
                 <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
                    <StatBar label="Possession %" hVal={stats.home.possession} aVal={stats.away.possession} />
                    <StatBar label="Shots On Target" hVal={stats.home.shotsOnTarget} aVal={stats.away.shotsOnTarget} />
                    <StatBar label="Corners" hVal={stats.home.corners} aVal={stats.away.corners} />
                    <StatBar label="Dangerous Attacks" hVal={stats.home.dangerousAttacks} aVal={stats.away.dangerousAttacks} />
                    <StatBar label="Expected Goals (xG)" hVal={stats.home.expectedGoals} aVal={stats.away.expectedGoals} />
                 </div>
              </div>
           ) : (
              <div className="text-center py-4 text-slate-500 text-xs italic">No statistical snapshot available for this alert.</div>
           )}

           {/* Pre-Match Context */}
           {preOdds && (
              <div>
                 <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Trophy size={12} className="text-slate-500" /> Pre-Match Market (1x2)
                 </h4>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                       <div className="text-[9px] text-slate-500 uppercase font-bold">Home</div>
                       <div className="text-xs font-mono font-bold text-white">{preOdds.homeWin}</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                       <div className="text-[9px] text-slate-500 uppercase font-bold">Draw</div>
                       <div className="text-xs font-mono font-bold text-white">{preOdds.draw}</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                       <div className="text-[9px] text-slate-500 uppercase font-bold">Away</div>
                       <div className="text-xs font-mono font-bold text-white">{preOdds.awayWin}</div>
                    </div>
                 </div>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

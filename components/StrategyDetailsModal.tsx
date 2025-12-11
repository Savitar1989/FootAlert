import React, { useState } from 'react';
import { AlertStrategy, MarketStrategy } from '../types';
import { X, TrendingUp, Target, Activity, Clock, Layers, History, DollarSign } from 'lucide-react';

interface StrategyDetailsModalProps {
  strategy: AlertStrategy | MarketStrategy;
  onClose: () => void;
  isMarket?: boolean;
}

export const StrategyDetailsModal: React.FC<StrategyDetailsModalProps> = ({ strategy, onClose, isMarket }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const history = strategy.history || [];
  const marketStrat = isMarket ? (strategy as MarketStrategy) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {strategy.name}
              {marketStrat && (
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${marketStrat.price === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                   {marketStrat.price === 0 ? 'Free' : `$${marketStrat.price}`}
                 </span>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
               {marketStrat && <span className="text-indigo-400 font-bold">{marketStrat.author}</span>}
               {marketStrat && <span>•</span>}
               <span className="flex items-center gap-1"><Target size={14} className="text-brand-500" /> Target: <strong className="text-white">{strategy.targetOutcome}</strong></span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900">
           <div className="p-4 border-r border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">ROI</div>
              <div className={`text-xl font-bold font-mono ${(strategy.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(strategy.roi || 0) > 0 ? '+' : ''}{strategy.roi || 0}%
              </div>
           </div>
           <div className="p-4 border-r border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Strike Rate</div>
              <div className="text-xl font-bold text-white font-mono">{strategy.strikeRate || 0}%</div>
           </div>
           <div className="p-4 border-r border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Hits</div>
              <div className="text-xl font-bold text-white font-mono">{strategy.totalHits || 0}</div>
           </div>
           <div className="p-4 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Avg Odds</div>
              <div className="text-xl font-bold text-indigo-400 font-mono">{strategy.avgOdds || '-'}</div>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'overview' ? 'border-brand-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
           >
             Logic Overview
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'history' ? 'border-brand-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
           >
             Alert History ({history.length})
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20 custom-scrollbar">
           
           {activeTab === 'overview' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in">
                {marketStrat && (
                   <div className="glass-card p-4 rounded-xl border-l-4 border-l-purple-500">
                      <h3 className="text-xs font-bold text-purple-400 uppercase mb-2">Strategy Description</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{marketStrat.description}</p>
                   </div>
                )}
                
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Layers size={14} /> Logic Stack</h3>
                   <div className="space-y-3">
                      {strategy.criteria.map((crit, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-700">
                              {i + 1}
                           </div>
                           <div className="flex-1">
                              <div className="text-sm font-bold text-white">{crit.metric}</div>
                              <div className="text-xs text-slate-500 mt-0.5">Condition type: <span className="text-slate-400">{crit.metric.includes('Pre') ? 'Pre-Match' : 'Live In-Play'}</span></div>
                           </div>
                           <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-brand-400 font-mono font-bold">
                              {crit.operator} {crit.value}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'history' && (
             <div className="animate-in slide-in-from-bottom-2 fade-in">
                {history.length === 0 ? (
                   <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      <History size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No recorded history yet.</p>
                   </div>
                ) : (
                   <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-900 border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Match</th>
                            <th className="px-4 py-3">Trigger Time</th>
                            <th className="px-4 py-3 text-center">Odds</th>
                            <th className="px-4 py-3 text-center">Score (Trig)</th>
                            <th className="px-4 py-3 text-center">Score (HT)</th>
                            <th className="px-4 py-3 text-center">Score (FT)</th>
                            <th className="px-4 py-3 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.slice().reverse().map((ticket) => (
                            <tr key={ticket.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 bg-slate-900/20">
                              <td className="px-4 py-3 font-medium text-white">
                                 <div>{ticket.homeTeam}</div>
                                 <div className="text-slate-500 text-xs">vs {ticket.awayTeam}</div>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                 {new Date(ticket.triggerTime).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-indigo-400">
                                 {ticket.oddsAtTrigger}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-white">
                                 {ticket.initialScore.home}-{ticket.initialScore.away}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-400">
                                 {ticket.htScore || '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-white">
                                 {ticket.ftScore || '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'WON' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {ticket.status}
                                 </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
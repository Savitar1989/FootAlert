

import React, { useState } from 'react';
import { AlertStrategy, CriteriaMetric, Operator, AlertCriteria, TargetOutcome } from '../types';
import { Plus, Trash2, Save, X, Info, Clock, Goal, Activity, Shield, TrendingUp, History, DollarSign, Crosshair, Filter, Layers, Zap, Hash, Globe, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../services/authService';

interface StrategyBuilderProps {
  onSave: (strategy: AlertStrategy) => void;
  onCancel: () => void;
}

// Visual Helper for Metric Categories
const CATEGORIES = [
  { id: 'live_general', label: 'Time & Status', icon: Clock, color: 'text-blue-400' },
  { id: 'live_goals', label: 'Live Goals', icon: Goal, color: 'text-emerald-400' },
  { id: 'live_pressure', label: 'Pressure (xG/Att)', icon: Zap, color: 'text-orange-400' },
  { id: 'live_shots', label: 'Shots & Corners', icon: Crosshair, color: 'text-rose-400' },
  { id: 'live_odds', label: 'Live Odds', icon: DollarSign, color: 'text-yellow-400' },
  { id: 'pre_form', label: 'Pre-Match Form', icon: TrendingUp, color: 'text-indigo-400' },
  { id: 'pre_goals', label: 'Hist. Goals', icon: History, color: 'text-purple-400' },
  { id: 'pre_odds', label: 'Pre-Odds', icon: DollarSign, color: 'text-slate-400' },
];

const METRIC_LIBRARY: Record<string, CriteriaMetric[]> = {
  live_general: [CriteriaMetric.TIME],
  live_goals: [
    CriteriaMetric.GOALS_TOTAL, CriteriaMetric.GOALS_HOME, CriteriaMetric.GOALS_AWAY,
    CriteriaMetric.GOAL_DIFF
  ],
  live_pressure: [
    CriteriaMetric.XG_TOTAL, CriteriaMetric.XG_HOME, CriteriaMetric.XG_AWAY,
    CriteriaMetric.DA_TOTAL, CriteriaMetric.DA_HOME, CriteriaMetric.DA_AWAY,
    CriteriaMetric.POSSESSION_HOME, CriteriaMetric.POSSESSION_AWAY,
    CriteriaMetric.ATTACKS_TOTAL
  ],
  live_shots: [
    CriteriaMetric.SHOTS_ON_TOTAL, CriteriaMetric.SHOTS_ON_HOME, CriteriaMetric.SHOTS_ON_AWAY,
    CriteriaMetric.SHOTS_OFF_TOTAL, CriteriaMetric.SHOTS_OFF_HOME, CriteriaMetric.SHOTS_OFF_AWAY,
    CriteriaMetric.CORNERS_TOTAL, CriteriaMetric.CORNERS_HOME, CriteriaMetric.CORNERS_AWAY
  ],
  live_odds: [
    CriteriaMetric.ODDS_HOME_WIN, CriteriaMetric.ODDS_AWAY_WIN, CriteriaMetric.ODDS_DRAW, CriteriaMetric.ODDS_OVER_25
  ],
  pre_form: [
    CriteriaMetric.PRE_PPG_HOME, CriteriaMetric.PRE_PPG_AWAY,
    CriteriaMetric.PRE_LEAGUE_POS_HOME, CriteriaMetric.PRE_LEAGUE_POS_AWAY,
    CriteriaMetric.PRE_CLEAN_SHEET_HOME, CriteriaMetric.PRE_CLEAN_SHEET_AWAY,
    CriteriaMetric.PRE_BTTS_HOME, CriteriaMetric.PRE_BTTS_ANY
  ],
  pre_goals: [
    CriteriaMetric.PRE_AVG_GOALS_SCORED_HOME, CriteriaMetric.PRE_AVG_GOALS_SCORED_ANY,
    CriteriaMetric.PRE_AVG_GOALS_CONCEDED_HOME, CriteriaMetric.PRE_AVG_GOALS_CONCEDED_ANY,
    CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_FOR_HOME, CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_FOR_ANY,
    CriteriaMetric.PRE_AVG_TIME_1ST_GOAL_HOME
  ],
  pre_odds: [
    CriteriaMetric.PRE_ODDS_HOME_WIN, CriteriaMetric.PRE_ODDS_AWAY_WIN, CriteriaMetric.PRE_ODDS_OVER_25
  ]
};

const OUTCOME_GROUPS = {
  'Match Winner': [TargetOutcome.HOME_WIN, TargetOutcome.DRAW, TargetOutcome.AWAY_WIN],
  'Goals (Over)': [TargetOutcome.OVER_0_5_GOALS, TargetOutcome.OVER_1_5_GOALS, TargetOutcome.OVER_2_5_GOALS, TargetOutcome.BTTS_YES],
  'Goals (Under)': [TargetOutcome.UNDER_1_5_GOALS, TargetOutcome.UNDER_2_5_GOALS, TargetOutcome.UNDER_3_5_GOALS],
  'Corners': [TargetOutcome.OVER_8_5_CORNERS, TargetOutcome.OVER_9_5_CORNERS, TargetOutcome.UNDER_10_5_CORNERS],
  'Half Time': [TargetOutcome.HT_OVER_0_5, TargetOutcome.HT_HOME_WIN, TargetOutcome.HT_DRAW]
};

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [targetOutcome, setTargetOutcome] = useState<TargetOutcome>(TargetOutcome.OVER_0_5_GOALS);
  const [criteriaList, setCriteriaList] = useState<AlertCriteria[]>([
    { id: uuidv4(), metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 70 },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('live_general');
  
  // Market Options
  const [isPublic, setIsPublic] = useState(false);
  const [price, setPrice] = useState(0);

  const currentUser = getCurrentUser();
  const isTrial = currentUser?.subscription.plan === 'trial';

  const addCriteria = (metric: CriteriaMetric) => {
    let defaultValue = 0;
    if (metric.includes('Odds')) defaultValue = 1.50;
    setCriteriaList([...criteriaList, { id: uuidv4(), metric, operator: Operator.GREATER_THAN, value: defaultValue }]);
  };

  const removeCriteria = (id: string) => {
    setCriteriaList(criteriaList.filter(c => c.id !== id));
  };

  const updateCriteria = (id: string, field: keyof AlertCriteria, value: any) => {
    setCriteriaList(criteriaList.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    if (!name.trim()) return alert("Please name your strategy");
    onSave({
      id: uuidv4(), userId: '', name, active: true, criteria: criteriaList, targetOutcome,
      triggeredMatches: [], wins: 0, totalHits: 0, strikeRate: 0, avgOdds: 0,
      isPublic, price
    });
  };

  const getInputConfig = (metric: string) => {
    if (metric.includes('Odds')) return { step: "0.01", prefix: "@", width: "w-24" };
    if (metric.includes('%')) return { step: "1", suffix: "%", width: "w-20" };
    if (metric.includes('Time')) return { step: "1", suffix: "'", width: "w-20" };
    return { step: "1", width: "w-20" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
               <Layers className="text-brand-400" size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-white">Strategy Studio</h2>
               <p className="text-xs text-slate-400">Build your automated betting algorithm</p>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">Discard</button>
             <button onClick={handleSave} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-brand-500/20 flex items-center gap-2">
               <Save size={16} /> Save Strategy
             </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Builder Canvas */}
          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950/30">
            
            {/* 1. Configuration Panel */}
            <div className="p-6 border-b border-slate-800 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Strategy Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Late Goal Hunter"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target Outcome</label>
                    <select 
                      value={targetOutcome}
                      onChange={(e) => setTargetOutcome(e.target.value as TargetOutcome)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none cursor-pointer appearance-none"
                    >
                      {Object.entries(OUTCOME_GROUPS).map(([group, outcomes]) => (
                        <optgroup key={group} label={group}>
                          {outcomes.map(o => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ))}
                    </select>
                 </div>
               </div>

               {/* Marketplace Options */}
               <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2"><Globe size={14} /> Marketplace Settings</h3>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-slate-400">Publish to Market</span>
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-brand-500" />
                     </label>
                  </div>
                  
                  {isPublic && (
                    <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                       <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Price ($)</label>
                          <div className="relative">
                             <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
                             <input 
                               type="number" 
                               min="0"
                               max="100"
                               value={price}
                               onChange={(e) => setPrice(Number(e.target.value))}
                               disabled={isTrial}
                               className={`w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:border-brand-500 focus:outline-none ${isTrial ? 'opacity-50 cursor-not-allowed' : ''}`}
                             />
                          </div>
                          {isTrial && (
                             <div className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                                <Lock size={10} /> Trial users can only publish Free strategies.
                             </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Fee</div>
                          <div className="text-sm font-bold text-slate-300">15% per sale</div>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* 2. Logic Stack (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
               <div className="absolute top-0 left-6 bottom-0 w-px bg-slate-800/50"></div>
               
               {criteriaList.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl m-4">
                    <Filter className="opacity-20 mb-2" size={40} />
                    <p className="text-sm">No conditions added.</p>
                    <p className="text-xs">Select a metric from the right panel to begin.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {criteriaList.map((criterion, idx) => {
                     const config = getInputConfig(criterion.metric);
                     const isPreMatch = criterion.metric.startsWith('Pre');
                     return (
                       <div key={criterion.id} className="relative pl-8 group animate-in slide-in-from-left-2 duration-300">
                         {/* Connector Dot */}
                         <div className="absolute left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 z-10 group-hover:bg-brand-500 group-hover:border-brand-400 transition-colors"></div>
                         
                         <div className={`glass-card p-4 rounded-xl flex items-center gap-4 transition-all hover:border-brand-500/30 ${isPreMatch ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-brand-500'}`}>
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isPreMatch ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {isPreMatch ? 'Pre-Match' : 'Live'}
                                  </span>
                               </div>
                               <div className="font-medium text-white text-sm">{criterion.metric}</div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800">
                               <select 
                                 value={criterion.operator}
                                 onChange={(e) => updateCriteria(criterion.id, 'operator', e.target.value)}
                                 className="bg-transparent text-brand-400 font-bold text-sm text-center focus:outline-none cursor-pointer w-10"
                               >
                                 {Object.values(Operator).map(op => <option key={op} value={op}>{op}</option>)}
                               </select>
                               <div className="w-px h-4 bg-slate-800"></div>
                               <div className="relative flex items-center">
                                  {config.prefix && <span className="text-slate-500 text-xs font-bold pl-2">{config.prefix}</span>}
                                  <input 
                                    type="number" 
                                    step={config.step}
                                    value={criterion.value}
                                    onChange={(e) => updateCriteria(criterion.id, 'value', parseFloat(e.target.value))}
                                    className={`bg-transparent text-white font-mono text-sm focus:outline-none py-1 px-2 ${config.width} text-right`}
                                  />
                                  {config.suffix && <span className="text-slate-500 text-xs font-bold pr-2">{config.suffix}</span>}
                               </div>
                            </div>

                            <button onClick={() => removeCriteria(criterion.id)} className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                               <Trash2 size={16} />
                            </button>
                         </div>
                         
                         {idx < criteriaList.length - 1 && (
                            <div className="absolute left-8 -bottom-5 text-[10px] font-bold text-slate-600 bg-slate-900 px-1 z-10">AND</div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>

            {/* Summary Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
               <Info size={14} />
               <span>Alert triggers when <strong>ALL</strong> conditions above are met simultaneously.</span>
            </div>
          </div>

          {/* RIGHT: Metric Library */}
          <div className="w-80 bg-slate-900 flex flex-col border-l border-slate-800">
             <div className="p-4 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Add Condition</h3>
                <div className="grid grid-cols-4 gap-2">
                   {CATEGORIES.map(cat => (
                     <button 
                       key={cat.id}
                       onClick={() => setSelectedCategory(cat.id)}
                       className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${selectedCategory === cat.id ? 'bg-slate-800 text-white ring-1 ring-slate-600' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                       title={cat.label}
                     >
                        <cat.icon size={20} className={`mb-1 ${selectedCategory === cat.id ? cat.color : ''}`} />
                     </button>
                   ))}
                </div>
                <div className="mt-3 text-center text-xs font-bold text-slate-400">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {METRIC_LIBRARY[selectedCategory].map(metric => (
                   <button 
                     key={metric}
                     onClick={() => addCriteria(metric)}
                     className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-brand-500/30 group transition-all"
                   >
                      <div className="text-xs text-slate-300 font-medium group-hover:text-white">{metric}</div>
                      <div className="flex justify-between items-center mt-1">
                         <span className="text-[9px] text-slate-600 uppercase font-bold">{getInputConfig(metric).prefix ? 'Value' : 'Number'}</span>
                         <Plus size={12} className="text-slate-600 group-hover:text-brand-400" />
                      </div>
                   </button>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

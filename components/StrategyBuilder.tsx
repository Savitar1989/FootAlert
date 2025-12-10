
import React, { useState } from 'react';
import { AlertStrategy, CriteriaMetric, Operator, AlertCriteria } from '../types';
import { Plus, Trash2, Save, X, Filter, Info, Activity, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface StrategyBuilderProps {
  onSave: (strategy: AlertStrategy) => void;
  onCancel: () => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'prematch'>('live');
  const [criteriaList, setCriteriaList] = useState<AlertCriteria[]>([
    { id: uuidv4(), metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 70 },
  ]);

  const addCriteria = (metric: CriteriaMetric) => {
    setCriteriaList([
      ...criteriaList,
      { id: uuidv4(), metric, operator: Operator.GREATER_THAN, value: 0 }
    ]);
  };

  const removeCriteria = (id: string) => {
    setCriteriaList(criteriaList.filter(c => c.id !== id));
  };

  const updateCriteria = (id: string, field: keyof AlertCriteria, value: any) => {
    setCriteriaList(criteriaList.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please name your strategy");
      return;
    }
    const strategy: AlertStrategy = {
      id: uuidv4(),
      name,
      active: true,
      criteria: criteriaList,
      triggeredMatches: []
    };
    onSave(strategy);
  };

  // Group metrics for better UI
  const liveMetricGroups = {
    'General': [CriteriaMetric.TIME],
    'Goals': [CriteriaMetric.GOALS_TOTAL, CriteriaMetric.GOALS_HOME, CriteriaMetric.GOALS_AWAY],
    'Expected Goals (xG)': [CriteriaMetric.XG_TOTAL, CriteriaMetric.XG_HOME, CriteriaMetric.XG_AWAY],
    'Attacking': [
        CriteriaMetric.SHOTS_ON_TOTAL, CriteriaMetric.SHOTS_ON_HOME, CriteriaMetric.SHOTS_ON_AWAY,
        CriteriaMetric.SHOTS_OFF_TOTAL, CriteriaMetric.SHOTS_OFF_HOME, CriteriaMetric.SHOTS_OFF_AWAY,
        CriteriaMetric.CORNERS_TOTAL, CriteriaMetric.CORNERS_HOME, CriteriaMetric.CORNERS_AWAY
    ],
    'Pressure': [
        CriteriaMetric.ATTACKS_TOTAL, CriteriaMetric.ATTACKS_HOME, CriteriaMetric.ATTACKS_AWAY,
        CriteriaMetric.DA_TOTAL, CriteriaMetric.DA_HOME, CriteriaMetric.DA_AWAY,
        CriteriaMetric.POSSESSION_HOME, CriteriaMetric.POSSESSION_AWAY
    ],
    'Discipline': [
        CriteriaMetric.YELLOW_TOTAL, CriteriaMetric.YELLOW_HOME, CriteriaMetric.YELLOW_AWAY,
        CriteriaMetric.RED_TOTAL, CriteriaMetric.RED_HOME, CriteriaMetric.RED_AWAY
    ]
  };

  const preMatchMetricGroups = {
    'Historical Goals': [
      CriteriaMetric.PRE_AVG_GOALS_SCORED_HOME, CriteriaMetric.PRE_AVG_GOALS_SCORED_AWAY,
      CriteriaMetric.PRE_AVG_GOALS_CONCEDED_HOME, CriteriaMetric.PRE_AVG_GOALS_CONCEDED_AWAY
    ],
    'Probabilities': [
      CriteriaMetric.PRE_BTTS_HOME, CriteriaMetric.PRE_BTTS_AWAY,
      CriteriaMetric.PRE_OVER25_HOME, CriteriaMetric.PRE_OVER25_AWAY
    ],
    'Corners': [
      CriteriaMetric.PRE_AVG_CORNERS_HOME, CriteriaMetric.PRE_AVG_CORNERS_AWAY
    ]
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
      <div className="p-5 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Filter size={18} className="text-brand-400" /> Create Alert Strategy
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Name Input */}
      <div className="p-4 bg-slate-900 border-b border-slate-800">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Strategy Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. High xG No Goals"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 font-medium"
          />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-slate-700 bg-slate-800/30">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'live' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Activity size={16} /> Live Stats
          </button>
          <button
            onClick={() => setActiveTab('prematch')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'prematch' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <History size={16} /> Pre-Match Stats
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {/* Add Buttons */}
           <div className="mb-6 grid grid-cols-2 gap-3">
              {Object.entries(activeTab === 'live' ? liveMetricGroups : preMatchMetricGroups).map(([group, metrics]) => (
                <div key={group} className="space-y-1">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 ml-1">{group}</h4>
                  <select 
                    className="w-full bg-slate-800 text-xs text-slate-300 p-2 rounded border border-slate-700 hover:border-slate-500 focus:border-brand-500 cursor-pointer"
                    onChange={(e) => {
                      if(e.target.value) {
                         addCriteria(e.target.value as CriteriaMetric);
                         e.target.value = "";
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>+ Add Condition...</option>
                    {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              ))}
           </div>

           {/* Active Criteria List */}
           <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Active Conditions</h3>
             {criteriaList.length === 0 && (
                <div className="text-center py-6 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-lg">
                   No conditions set. Add a metric from above.
                </div>
             )}
             
             {criteriaList.map((criterion, index) => (
               <div key={criterion.id} className="flex flex-wrap gap-2 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-colors">
                 <span className="text-slate-500 text-xs font-mono w-4 font-bold">{index + 1}.</span>
                 
                 <div className="flex-1 min-w-[140px]">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Metric</div>
                    <div className="text-sm font-medium text-white">{criterion.metric}</div>
                 </div>

                 <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Operator</div>
                    <select 
                      className="w-full bg-slate-900 text-brand-400 text-xs font-bold rounded p-2 border border-slate-700 focus:outline-none"
                      value={criterion.operator}
                      onChange={(e) => updateCriteria(criterion.id, 'operator', e.target.value)}
                    >
                      {Object.values(Operator).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                 </div>

                 <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Value</div>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-slate-900 text-white text-xs rounded p-2 border border-slate-700 focus:outline-none focus:border-brand-500"
                      value={criterion.value}
                      onChange={(e) => updateCriteria(criterion.id, 'value', parseFloat(e.target.value))}
                    />
                 </div>

                 <button 
                   onClick={() => removeCriteria(criterion.id)}
                   className="ml-2 text-slate-600 hover:text-red-400 p-2 rounded hover:bg-red-400/10 transition-colors self-end mb-0.5"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div className="flex gap-2 mb-3">
             <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
             <p className="text-[10px] text-blue-200/70 leading-relaxed">
                Alerts trigger only when <strong>ALL</strong> conditions (Live & Pre-Match) are met. <br/>
                <span className="text-orange-400">Note:</span> If a stat is unavailable (N/A) for a match, it will be skipped by the alert engine.
             </p>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-900 font-bold rounded-lg shadow-lg shadow-brand-900/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Save size={18} /> Save Strategy
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bell, Home, Settings, PlusCircle, Trash2, List, Wifi, AlertTriangle, Search, Filter } from 'lucide-react';

import { Match, AlertStrategy, NotificationLog, CriteriaMetric, Operator, ApiSettings } from './types';
import { fetchLiveMatches } from './services/footballApi';
import { MatchCard } from './components/MatchCard';
import { StrategyBuilder } from './components/StrategyBuilder';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_STRATEGIES: AlertStrategy[] = [
  {
    id: 'default-1',
    name: 'Late Goal Hunter (High Pressure)',
    active: true,
    criteria: [
      { id: 'c1', metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 70 },
      { id: 'c2', metric: CriteriaMetric.GOALS_TOTAL, operator: Operator.EQUALS, value: 0 },
      { id: 'c3', metric: CriteriaMetric.DA_TOTAL, operator: Operator.GREATER_THAN, value: 30 }
    ],
    triggeredMatches: []
  },
  {
    id: 'default-2',
    name: 'High xG No Goals',
    active: true,
    criteria: [
      { id: 'x1', metric: CriteriaMetric.XG_TOTAL, operator: Operator.GREATER_THAN, value: 1.5 },
      { id: 'x2', metric: CriteriaMetric.GOALS_TOTAL, operator: Operator.EQUALS, value: 0 },
      { id: 'x3', metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 45 }
    ],
    triggeredMatches: []
  }
];

// Permission Helper
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/53/53283.png",
      tag: "betscout-alert"
    });
  }
};

export default function App() {
  const [view, setView] = useState<'matches' | 'strategies' | 'alerts'>('matches');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [strategies, setStrategies] = useState<AlertStrategy[]>(DEFAULT_STRATEGIES);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('betscout_settings');
    return saved ? JSON.parse(saved) : { apiKey: '', refreshRate: 60, useDemoData: true };
  });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Persist settings
  useEffect(() => {
    localStorage.setItem('betscout_settings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  // Initial Permission Request
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch Logic
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLiveMatches(apiSettings.apiKey, apiSettings.useDemoData);
      setMatches(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch matches. Please check settings or connection.");
    } finally {
      setLoading(false);
    }
  }, [apiSettings]);

  // Polling Effect
  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, apiSettings.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [loadMatches, apiSettings.refreshRate]);

  // Alert Logic
  useEffect(() => {
    if (matches.length === 0) return;

    const newNotifications: NotificationLog[] = [];
    const updatedStrategies = strategies.map(strategy => {
      if (!strategy.active) return strategy;

      const triggeredNow: string[] = [];

      matches.forEach(match => {
        // Skip if already triggered for this match
        if (strategy.triggeredMatches.includes(match.id)) return;

        // Check conditions
        const allMet = strategy.criteria.every(criteria => {
          const { home, away } = match.stats;
          const preHome = match.preMatch.home;
          const preAway = match.preMatch.away;
          let actualValue: number | null = 0;

          // Helper to sum nullable stats
          const sum = (a: number | null, b: number | null) => (a === null || b === null) ? null : a + b;

          // Map metrics to values
          switch (criteria.metric) {
            case CriteriaMetric.TIME: actualValue = match.minute; break;
            
            // LIVE STATS
            case CriteriaMetric.GOALS_HOME: actualValue = home.goals; break;
            case CriteriaMetric.GOALS_AWAY: actualValue = away.goals; break;
            case CriteriaMetric.GOALS_TOTAL: actualValue = home.goals + away.goals; break;

            case CriteriaMetric.XG_HOME: actualValue = home.expectedGoals; break;
            case CriteriaMetric.XG_AWAY: actualValue = away.expectedGoals; break;
            case CriteriaMetric.XG_TOTAL: actualValue = sum(home.expectedGoals, away.expectedGoals); break;

            case CriteriaMetric.CORNERS_HOME: actualValue = home.corners; break;
            case CriteriaMetric.CORNERS_AWAY: actualValue = away.corners; break;
            case CriteriaMetric.CORNERS_TOTAL: actualValue = sum(home.corners, away.corners); break;

            case CriteriaMetric.SHOTS_ON_HOME: actualValue = home.shotsOnTarget; break;
            case CriteriaMetric.SHOTS_ON_AWAY: actualValue = away.shotsOnTarget; break;
            case CriteriaMetric.SHOTS_ON_TOTAL: actualValue = sum(home.shotsOnTarget, away.shotsOnTarget); break;
            
            case CriteriaMetric.SHOTS_OFF_HOME: actualValue = home.shotsOffTarget; break;
            case CriteriaMetric.SHOTS_OFF_AWAY: actualValue = away.shotsOffTarget; break;
            case CriteriaMetric.SHOTS_OFF_TOTAL: actualValue = sum(home.shotsOffTarget, away.shotsOffTarget); break;

            case CriteriaMetric.ATTACKS_HOME: actualValue = home.attacks; break;
            case CriteriaMetric.ATTACKS_AWAY: actualValue = away.attacks; break;
            case CriteriaMetric.ATTACKS_TOTAL: actualValue = sum(home.attacks, away.attacks); break;
            
            case CriteriaMetric.DA_HOME: actualValue = home.dangerousAttacks; break;
            case CriteriaMetric.DA_AWAY: actualValue = away.dangerousAttacks; break;
            case CriteriaMetric.DA_TOTAL: actualValue = sum(home.dangerousAttacks, away.dangerousAttacks); break;
            
            case CriteriaMetric.POSSESSION_HOME: actualValue = home.possession; break;
            case CriteriaMetric.POSSESSION_AWAY: actualValue = away.possession; break;
            
            case CriteriaMetric.YELLOW_HOME: actualValue = home.yellowCards; break;
            case CriteriaMetric.YELLOW_AWAY: actualValue = away.yellowCards; break;
            case CriteriaMetric.YELLOW_TOTAL: actualValue = sum(home.yellowCards, away.yellowCards); break;
            
            case CriteriaMetric.RED_HOME: actualValue = home.redCards; break;
            case CriteriaMetric.RED_AWAY: actualValue = away.redCards; break;
            case CriteriaMetric.RED_TOTAL: actualValue = sum(home.redCards, away.redCards); break;

            // PRE-MATCH STATS
            case CriteriaMetric.PRE_AVG_GOALS_SCORED_HOME: actualValue = preHome.avgGoalsScored; break;
            case CriteriaMetric.PRE_AVG_GOALS_SCORED_AWAY: actualValue = preAway.avgGoalsScored; break;
            case CriteriaMetric.PRE_AVG_GOALS_CONCEDED_HOME: actualValue = preHome.avgGoalsConceded; break;
            case CriteriaMetric.PRE_AVG_GOALS_CONCEDED_AWAY: actualValue = preAway.avgGoalsConceded; break;
            case CriteriaMetric.PRE_AVG_CORNERS_HOME: actualValue = preHome.avgCorners; break;
            case CriteriaMetric.PRE_AVG_CORNERS_AWAY: actualValue = preAway.avgCorners; break;
            case CriteriaMetric.PRE_BTTS_HOME: actualValue = preHome.bttsPercentage; break;
            case CriteriaMetric.PRE_BTTS_AWAY: actualValue = preAway.bttsPercentage; break;
            case CriteriaMetric.PRE_OVER25_HOME: actualValue = preHome.over25Percentage; break;
            case CriteriaMetric.PRE_OVER25_AWAY: actualValue = preAway.over25Percentage; break;
          }

          // Important: If data is N/A (null), we CANNOT evaluate strict operators.
          // We return false to be safe (don't trigger on missing data).
          if (actualValue === null || actualValue === undefined) return false;

          switch (criteria.operator) {
            case Operator.GREATER_THAN: return actualValue > criteria.value;
            case Operator.LESS_THAN: return actualValue < criteria.value;
            case Operator.EQUALS: return actualValue === criteria.value;
            case Operator.GREATER_EQUAL: return actualValue >= criteria.value;
            case Operator.LESS_EQUAL: return actualValue <= criteria.value;
            default: return false;
          }
        });

        if (allMet) {
          triggeredNow.push(match.id);
          const msg = `${match.homeTeam} vs ${match.awayTeam} (${match.minute}') matched criteria.`;
          
          newNotifications.push({
            id: uuidv4(),
            matchId: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            strategyName: strategy.name,
            message: msg,
            timestamp: Date.now(),
            read: false
          });

          sendNotification("BetScout Strategy Hit! 🎯", msg);
        }
      });

      if (triggeredNow.length > 0) {
        return { ...strategy, triggeredMatches: [...strategy.triggeredMatches, ...triggeredNow] };
      }
      return strategy;
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      setStrategies(updatedStrategies);
    }
  }, [matches]); 

  // Handlers
  const addStrategy = (strategy: AlertStrategy) => {
    setStrategies([...strategies, strategy]);
    setIsBuilderOpen(false);
  };

  const deleteStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const toggleStrategy = (id: string) => {
    setStrategies(strategies.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const filteredMatches = matches.filter(m => 
    m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/20">
              <List className="text-white" size={24} />
           </div>
           <div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">BetScout</h1>
             <div className="flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full ${apiSettings.useDemoData ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></span>
               <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                 {apiSettings.useDemoData ? 'PRO SIMULATION' : 'LIVE API'}
               </span>
             </div>
           </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto">
        
        {/* Error / Loading States */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm mb-4">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {/* Views */}
        {view === 'matches' && (
          <>
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search teams or leagues..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 transition-all"
              />
              <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
            </div>

            {loading && matches.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Scouring global pitches...</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {filteredMatches.map(match => (
                   <MatchCard key={match.id} match={match} />
                 ))}
                 {filteredMatches.length === 0 && !loading && (
                   <div className="text-center py-20 text-slate-500">
                     <Wifi size={48} className="mx-auto mb-4 opacity-20" />
                     <p>No matches found matching your criteria.</p>
                   </div>
                 )}
               </div>
            )}
          </>
        )}

        {view === 'strategies' && (
          <div className="space-y-4">
            <button 
              onClick={() => setIsBuilderOpen(true)}
              className="w-full py-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-sm">Create New Alert Strategy</span>
            </button>

            {strategies.map(strategy => (
              <div key={strategy.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{strategy.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${strategy.active ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-700 text-slate-400'}`}>
                        {strategy.active ? 'Active' : 'Paused'}
                      </span>
                      <span className="text-xs text-slate-500">{strategy.triggeredMatches.length} hits</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`w-10 h-6 rounded-full p-1 transition-colors ${strategy.active ? 'bg-brand-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${strategy.active ? 'translate-x-4' : ''}`}></div>
                    </button>
                    <button onClick={() => deleteStrategy(strategy.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  {strategy.criteria.map((c, i) => (
                    <div key={i} className="text-xs text-slate-400 flex justify-between border-b border-slate-800/50 pb-1 last:border-0">
                      <span>{c.metric}</span>
                      <span className="font-mono text-slate-300">{c.operator} {c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'alerts' && (
           <div className="space-y-3">
             {notifications.length === 0 ? (
               <div className="text-center py-20 text-slate-500">
                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="opacity-50" />
                 </div>
                 <p className="text-sm">No alerts triggered yet.</p>
                 <p className="text-xs mt-2 opacity-50">Set up strategies to get notified.</p>
               </div>
             ) : (
               notifications.map(note => (
                 <div key={note.id} className="bg-slate-900 border-l-4 border-brand-500 rounded-r-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase text-brand-400 tracking-wider">{note.strategyName}</span>
                      <span className="text-[10px] text-slate-500">{new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="font-bold text-white mb-1">{note.homeTeam} vs {note.awayTeam}</div>
                    <p className="text-xs text-slate-400">{note.message}</p>
                 </div>
               ))
             )}
           </div>
        )}
      </main>

      {/* Strategy Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="w-full max-w-lg">
             <StrategyBuilder 
               onSave={addStrategy}
               onCancel={() => setIsBuilderOpen(false)}
             />
           </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={apiSettings}
        onSave={(newSettings) => setApiSettings(newSettings)}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex justify-around p-3 z-40 safe-area-pb">
        <button 
          onClick={() => setView('matches')}
          className={`flex flex-col items-center gap-1 ${view === 'matches' ? 'text-brand-400' : 'text-slate-500'}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium">Live</span>
        </button>
        <button 
          onClick={() => setView('strategies')}
          className={`flex flex-col items-center gap-1 ${view === 'strategies' ? 'text-brand-400' : 'text-slate-500'}`}
        >
          <Filter size={20} />
          <span className="text-[10px] font-medium">Strategies</span>
        </button>
        <button 
          onClick={() => setView('alerts')}
          className={`relative flex flex-col items-center gap-1 ${view === 'alerts' ? 'text-brand-400' : 'text-slate-500'}`}
        >
          <div className="relative">
             <Bell size={20} />
             {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </button>
      </nav>
    </div>
  );
}

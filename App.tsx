

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bell, Home, Settings, PlusCircle, Trash2, List, Wifi, AlertTriangle, Search, Filter, LogOut, Shield, ShoppingBag, Target, Menu, LayoutDashboard, Wallet, CreditCard } from 'lucide-react';

import { Match, AlertStrategy, NotificationLog, CriteriaMetric, Operator, ApiSettings, User, TargetOutcome, BetTicket, ToastMessage } from './types';
import { fetchLiveMatches } from './services/footballApi';
import { getCurrentUser, logout } from './services/authService';
import { db } from './services/db';
import { ALERT_SOUND_DATA_URI } from './assets/sounds';

import { MatchCard } from './components/MatchCard';
import { StrategyBuilder } from './components/StrategyBuilder';
import { SettingsModal } from './components/SettingsModal';
import { Logo } from './components/Logo';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { StrategyMarket } from './components/StrategyMarket';
import { StrategyDetailsModal } from './components/StrategyDetailsModal';
import { AlertDetailsModal } from './components/AlertDetailsModal';
import { Toaster } from './components/Toaster';
import { FullscreenAlert } from './components/FullscreenAlert';
import { PricingModal } from './components/PricingModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [view, setView] = useState<'matches' | 'strategies' | 'alerts' | 'market' | 'admin'>('matches');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [strategies, setStrategies] = useState<AlertStrategy[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [betTickets, setBetTickets] = useState<BetTicket[]>([]); 
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fullscreenAlert, setFullscreenAlert] = useState<{title: string, message: string, type: 'success' | 'alert'} | null>(null);

  const [selectedStrategyDetail, setSelectedStrategyDetail] = useState<AlertStrategy | null>(null);
  const [selectedAlertTicket, setSelectedAlertTicket] = useState<BetTicket | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>({ userId: '', apiKey: '', refreshRate: 60, useDemoData: true });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(ALERT_SOUND_DATA_URI);
    audioRef.current.load();
  }, []);

  // CHECK SUBSCRIPTION STATUS
  useEffect(() => {
    if (currentUser) {
       const isExpired = currentUser.subscription.expiryDate < Date.now();
       if (isExpired && currentUser.subscription.status !== 'active') {
          // If actually expired and status not updated (though login check handles this, 
          // let's be safe for session expiry)
          setShowPricing(true);
       }
    }
  }, [currentUser]);

  // LOAD USER DATA FROM CLOUD DB
  useEffect(() => {
    if (currentUser) {
      const loadUserData = async () => {
        try {
          // 1. Load Settings
          const settings = await db.settings.get(currentUser.id);
          setApiSettings(settings);

          // 2. Load Strategies
          const strats = await db.strategies.getByUser(currentUser.id);
          setStrategies(strats);
          
          // 3. Refresh User Data (Wallet/Sub status)
          const freshUser = await db.users.getById(currentUser.id);
          if (freshUser) {
             setCurrentUser(freshUser); // Keep wallet synced
             if (freshUser.subscription.expiryDate < Date.now()) setShowPricing(true);
          }
        } catch (e) {
          console.error("Failed to sync with cloud DB", e);
        }
      };
      loadUserData();
    }
  }, [currentUser?.id]); // Only run on ID change or mount

  const playAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio blocked. User must interact with document first.", e));
    }
  };

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && currentUser) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW active'))
        .catch(error => console.error('SW fail:', error));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [currentUser]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const saveSettings = async (newSettings: ApiSettings) => {
     setApiSettings(newSettings);
     if (currentUser) {
       await db.settings.save({ ...newSettings, userId: currentUser.id });
     }
  };

  const loadMatches = useCallback(async () => {
    if (!currentUser || showPricing) return; // Stop fetching if locked
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
  }, [apiSettings, currentUser, showPricing]);

  useEffect(() => {
    if (!currentUser) return;
    loadMatches();
    const interval = setInterval(loadMatches, apiSettings.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [loadMatches, apiSettings.refreshRate, currentUser]);

  // --- CORE ENGINE: VERIFICATION & ROI CALCULATION ---
  useEffect(() => {
    if (betTickets.length === 0 || matches.length === 0) return;

    let updatedStrategies = [...strategies];
    let hasUpdates = false;

    const updatedTickets = betTickets.map(ticket => {
      if (ticket.status !== 'PENDING') return ticket;

      const match = matches.find(m => m.id === ticket.matchId);
      if (!match) return ticket;

      const hGoals = match.stats.home.goals;
      const aGoals = match.stats.away.goals;
      const totalGoals = hGoals + aGoals;
      const isFT = match.status === 'FT' || match.status === 'AET' || match.status === 'PEN';

      let newStatus: 'PENDING' | 'WON' | 'LOST' = 'PENDING';

      // Win Logic
      if (ticket.targetOutcome === TargetOutcome.OVER_0_5_GOALS && totalGoals > 0.5) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.OVER_1_5_GOALS && totalGoals > 1.5) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.OVER_2_5_GOALS && totalGoals > 2.5) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.BTTS_YES && hGoals > 0 && aGoals > 0) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.HOME_WIN && isFT && hGoals > aGoals) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.AWAY_WIN && isFT && aGoals > hGoals) newStatus = 'WON';
      else if (ticket.targetOutcome === TargetOutcome.DRAW && isFT && hGoals === aGoals) newStatus = 'WON';
      
      // Half Time Logic
      if (ticket.targetOutcome.includes('(HT)') && match.status === 'HT') {
         if (ticket.targetOutcome === TargetOutcome.HT_OVER_0_5 && (match.stats.home.goalsFirstHalf! + match.stats.away.goalsFirstHalf!) > 0.5) newStatus = 'WON';
         else if (ticket.targetOutcome === TargetOutcome.HT_UNDER_0_5 && (match.stats.home.goalsFirstHalf! + match.stats.away.goalsFirstHalf!) < 0.5) newStatus = 'WON';
         else newStatus = 'LOST'; 
      }

      // Loss Checks
      if (isFT && newStatus === 'PENDING') newStatus = 'LOST';
      if (ticket.targetOutcome === TargetOutcome.UNDER_2_5_GOALS && totalGoals > 2.5) newStatus = 'LOST';

      if (newStatus !== 'PENDING') {
        hasUpdates = true;
        
        if (newStatus === 'WON') {
           playAlertSound();
           setFullscreenAlert({
             title: 'BET WON!',
             message: `${ticket.targetOutcome} hit in ${ticket.homeTeam} vs ${ticket.awayTeam}`,
             type: 'success'
           });
        }

        updatedStrategies = updatedStrategies.map(s => {
          if (s.id !== ticket.strategyId) return s;

          const isWin = newStatus === 'WON';
          const newWins = s.wins! + (isWin ? 1 : 0);
          const newHistory = [...(s.history || []), {
            ...ticket,
            status: newStatus,
            htScore: `${match.stats.home.goalsFirstHalf || 0}-${match.stats.away.goalsFirstHalf || 0}`,
            ftScore: `${hGoals}-${aGoals}`
          }];
          
          const totalBets = newHistory.length;
          let totalRevenue = 0;
          let totalCost = totalBets; 

          newHistory.forEach(h => {
             if (h.status === 'WON') totalRevenue += h.oddsAtTrigger;
          });

          const newRoi = totalBets > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
          const newStrike = totalBets > 0 ? (newWins / totalBets) * 100 : 0;
          const avgOdds = totalBets > 0 ? parseFloat((newHistory.reduce((acc, curr) => acc + curr.oddsAtTrigger, 0) / totalBets).toFixed(2)) : 0;

          return {
            ...s,
            wins: newWins,
            totalHits: totalBets,
            history: newHistory,
            roi: parseFloat(newRoi.toFixed(2)),
            strikeRate: parseFloat(newStrike.toFixed(1)),
            avgOdds: avgOdds
          };
        });

        return { ...ticket, status: newStatus, resultTime: Date.now() };
      }
      return ticket;
    });

    if (hasUpdates) {
      setBetTickets(updatedTickets);
      setStrategies(updatedStrategies);
      
      // SYNC UPDATES TO DB
      updatedStrategies.forEach(s => db.strategies.update(s));
    }
  }, [matches]); 


  // --- CORE ENGINE: ALERT TRIGGER ---
  useEffect(() => {
    if (matches.length === 0 || !currentUser) return;

    const newNotifications: NotificationLog[] = [];
    const newTickets: BetTicket[] = [];

    const updatedStrategies = strategies.map(strategy => {
      if (!strategy.active) return strategy;
      const triggeredNow: string[] = [];

      matches.forEach(match => {
        if (strategy.triggeredMatches.includes(match.id)) return;
        
        const allMet = strategy.criteria.every(criteria => {
          const { home, away, liveOdds } = match.stats;
          const preHome = match.preMatch.home;
          const preAway = match.preMatch.away;
          const preOdds = match.preMatch.odds;

          let actualValue: number | null = 0;
          const sum = (a: number | null, b: number | null) => (a === null || b === null) ? null : a + b;
          const max = (a: number | null, b: number | null) => (a === null || b === null) ? null : Math.max(a, b);

           // LOGIC MAPPING 
           switch (criteria.metric) {
            case CriteriaMetric.TIME: actualValue = match.minute; break;
            case CriteriaMetric.GOALS_HOME: actualValue = home.goals; break;
            case CriteriaMetric.GOALS_AWAY: actualValue = away.goals; break;
            case CriteriaMetric.GOALS_TOTAL: actualValue = home.goals + away.goals; break;
            case CriteriaMetric.GOAL_DIFF: actualValue = home.goals - away.goals; break;
            case CriteriaMetric.ODDS_HOME_WIN: actualValue = liveOdds?.homeWin || null; break;
            case CriteriaMetric.ODDS_AWAY_WIN: actualValue = liveOdds?.awayWin || null; break;
            case CriteriaMetric.ODDS_DRAW: actualValue = liveOdds?.draw || null; break;
            case CriteriaMetric.ODDS_OVER_25: actualValue = liveOdds?.over25 || null; break;
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
            
            case CriteriaMetric.PRE_ODDS_HOME_WIN: actualValue = preOdds?.homeWin || null; break;
            case CriteriaMetric.PRE_ODDS_AWAY_WIN: actualValue = preOdds?.awayWin || null; break;
            case CriteriaMetric.PRE_ODDS_OVER_25: actualValue = preOdds?.over25 || null; break;
            case CriteriaMetric.PRE_AVG_GOALS_SCORED_HOME: actualValue = preHome.avgGoalsScored; break;
            case CriteriaMetric.PRE_AVG_GOALS_SCORED_AWAY: actualValue = preAway.avgGoalsScored; break;
            case CriteriaMetric.PRE_AVG_GOALS_SCORED_ANY: actualValue = max(preHome.avgGoalsScored, preAway.avgGoalsScored); break;
            case CriteriaMetric.PRE_AVG_GOALS_CONCEDED_HOME: actualValue = preHome.avgGoalsConceded; break;
            case CriteriaMetric.PRE_AVG_GOALS_CONCEDED_AWAY: actualValue = preAway.avgGoalsConceded; break;
            case CriteriaMetric.PRE_AVG_GOALS_CONCEDED_ANY: actualValue = max(preHome.avgGoalsConceded, preAway.avgGoalsConceded); break;
            case CriteriaMetric.PRE_PPG_HOME: actualValue = preHome.ppg; break;
            case CriteriaMetric.PRE_PPG_AWAY: actualValue = preAway.ppg; break;
            case CriteriaMetric.PRE_LEAGUE_POS_HOME: actualValue = preHome.leaguePosition; break;
            case CriteriaMetric.PRE_LEAGUE_POS_AWAY: actualValue = preAway.leaguePosition; break;
            case CriteriaMetric.PRE_CLEAN_SHEET_HOME: actualValue = preHome.cleanSheetPercentage; break;
            case CriteriaMetric.PRE_CLEAN_SHEET_AWAY: actualValue = preAway.cleanSheetPercentage; break;
            case CriteriaMetric.PRE_FAILED_SCORE_HOME: actualValue = preHome.failedToScorePercentage; break;
            case CriteriaMetric.PRE_FAILED_SCORE_AWAY: actualValue = preAway.failedToScorePercentage; break;
            case CriteriaMetric.PRE_BTTS_HOME: actualValue = preHome.bttsPercentage; break;
            case CriteriaMetric.PRE_BTTS_AWAY: actualValue = preAway.bttsPercentage; break;
            case CriteriaMetric.PRE_BTTS_ANY: actualValue = max(preHome.bttsPercentage, preAway.bttsPercentage); break;
            case CriteriaMetric.PRE_OVER25_HOME: actualValue = preHome.over25Percentage; break;
            case CriteriaMetric.PRE_OVER25_AWAY: actualValue = preAway.over25Percentage; break;
            case CriteriaMetric.PRE_OVER25_ANY: actualValue = max(preHome.over25Percentage, preAway.over25Percentage); break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_FOR_HOME: actualValue = preHome.avgFirstHalfGoalsFor; break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_FOR_AWAY: actualValue = preAway.avgFirstHalfGoalsFor; break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_FOR_ANY: actualValue = max(preHome.avgFirstHalfGoalsFor, preAway.avgFirstHalfGoalsFor); break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_FOR_HOME: actualValue = preHome.avgSecondHalfGoalsFor; break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_FOR_AWAY: actualValue = preAway.avgSecondHalfGoalsFor; break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_FOR_ANY: actualValue = max(preHome.avgSecondHalfGoalsFor, preAway.avgSecondHalfGoalsFor); break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_AGAINST_HOME: actualValue = preHome.avgFirstHalfGoalsAgainst; break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_AGAINST_AWAY: actualValue = preAway.avgFirstHalfGoalsAgainst; break;
            case CriteriaMetric.PRE_AVG_1ST_HALF_GOALS_AGAINST_ANY: actualValue = max(preHome.avgFirstHalfGoalsAgainst, preAway.avgFirstHalfGoalsAgainst); break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_AGAINST_HOME: actualValue = preHome.avgSecondHalfGoalsAgainst; break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_AGAINST_AWAY: actualValue = preAway.avgSecondHalfGoalsAgainst; break;
            case CriteriaMetric.PRE_AVG_2ND_HALF_GOALS_AGAINST_ANY: actualValue = max(preHome.avgSecondHalfGoalsAgainst, preAway.avgSecondHalfGoalsAgainst); break;
            case CriteriaMetric.PRE_AVG_TIME_1ST_GOAL_HOME: actualValue = preHome.avgTimeFirstGoalScored; break;
            case CriteriaMetric.PRE_AVG_TIME_1ST_GOAL_AWAY: actualValue = preAway.avgTimeFirstGoalScored; break;
          }

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
           const msg = `${match.homeTeam} vs ${match.awayTeam} (${match.minute}')`;
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
           
           // Alert System DB Log
           db.strategies.logAlert();

           let ticketOdds = 1.90; 
           const lo = match.stats.liveOdds;
           if (lo) {
              if (strategy.targetOutcome === TargetOutcome.HOME_WIN) ticketOdds = lo.homeWin;
              else if (strategy.targetOutcome === TargetOutcome.AWAY_WIN) ticketOdds = lo.awayWin;
              else if (strategy.targetOutcome === TargetOutcome.DRAW) ticketOdds = lo.draw;
              else if (strategy.targetOutcome === TargetOutcome.OVER_2_5_GOALS) ticketOdds = lo.over25;
              else if (strategy.targetOutcome === TargetOutcome.UNDER_2_5_GOALS) ticketOdds = lo.under25;
           }
 
           newTickets.push({
             id: uuidv4(),
             strategyId: strategy.id,
             strategyName: strategy.name,
             matchId: match.id,
             homeTeam: match.homeTeam,
             awayTeam: match.awayTeam,
             targetOutcome: strategy.targetOutcome,
             triggerTime: Date.now(),
             initialScore: { home: match.stats.home.goals, away: match.stats.away.goals },
             oddsAtTrigger: ticketOdds,
             status: 'PENDING',
             statsSnapshot: { home: match.stats.home, away: match.stats.away },
             preMatchOdds: match.preMatch.odds
           });
           
           playAlertSound();
           setFullscreenAlert({
             title: 'STRATEGY HIT!',
             message: `${strategy.name} triggered on ${match.homeTeam} vs ${match.awayTeam}`,
             type: 'alert'
           });
           
           if (Notification.permission === "granted") {
              new Notification("FootAlert Strategy Hit!", {
                body: msg,
                icon: "https://cdn-icons-png.flaticon.com/512/53/53283.png"
              });
           }
        }
      });

      if (triggeredNow.length > 0) {
        return { 
          ...strategy, 
          triggeredMatches: [...strategy.triggeredMatches, ...triggeredNow]
        };
      }
      return strategy;
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      setBetTickets(prev => [...prev, ...newTickets]);
      setStrategies(updatedStrategies);
      
      // Update DB
      updatedStrategies.forEach(s => db.strategies.update(s));
    }
  }, [matches, currentUser]);

  const addStrategy = async (strategy: AlertStrategy) => {
    if (!currentUser) return;
    const withUserId = { ...strategy, userId: currentUser.id };
    const saved = await db.strategies.create(withUserId);
    setStrategies([...strategies, saved]);
    setIsBuilderOpen(false);
  };

  const deleteStrategy = async (id: string) => {
    await db.strategies.delete(id);
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const toggleStrategy = async (id: string) => {
    const updated = strategies.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setStrategies(updated);
    const target = updated.find(s => s.id === id);
    if(target) await db.strategies.update(target);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Auth onSuccess={setCurrentUser} />;
  }

  const filteredMatches = matches.filter(m => 
    m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 font-sans selection:bg-brand-500/30">
      
      {showPricing && (
         <PricingModal 
           user={currentUser} 
           onSuccess={(u) => { setCurrentUser(u); setShowPricing(false); }} 
         />
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
      {fullscreenAlert && (
        <FullscreenAlert 
          title={fullscreenAlert.title} 
          message={fullscreenAlert.message} 
          type={fullscreenAlert.type} 
          onClose={() => setFullscreenAlert(null)} 
        />
      )}

      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-lg">
        <Logo />
        
        <div className="flex items-center gap-3">
           {/* Wallet Display */}
           <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
              <Wallet size={14} className="text-brand-500" />
              <span className="text-xs font-bold text-white font-mono">${currentUser.walletBalance.toFixed(2)}</span>
           </div>

           {currentUser.role === 'admin' && (
             <button onClick={() => setView('admin')} className={`p-2 rounded-lg transition-all ${view === 'admin' ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Shield size={20} />
             </button>
           )}
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto pb-24">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm mb-6">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {view === 'admin' && currentUser.role === 'admin' && <AdminDashboard settings={apiSettings} />}
        {view === 'market' && <StrategyMarket onImport={addStrategy} />}

        {view === 'matches' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-6 group">
              <input 
                type="text" placeholder="Search teams, leagues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-500/50 transition-all text-white placeholder-slate-500 shadow-lg"
              />
              <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={18} />
            </div>

            <div className="flex justify-between items-center mb-4 px-2">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span> Live Matches
               </h2>
               <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full ${apiSettings.useDemoData ? 'bg-orange-500' : 'bg-brand-500'} animate-pulse`}></span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{apiSettings.useDemoData ? 'Simulation Mode' : 'Live Feed'}</span>
               </div>
            </div>

            {loading && matches.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-2 border-slate-800 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Syncing Data Streams...</p>
               </div>
            ) : (
               <div className="space-y-4">
                 {filteredMatches.map(match => <MatchCard key={match.id} match={match} />)}
               </div>
            )}
          </div>
        )}

        {view === 'strategies' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setIsBuilderOpen(true)} className="w-full py-6 bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center gap-3 group shadow-lg">
              <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-slate-900 transition-all duration-300 shadow-xl"><PlusCircle size={24} /></div>
              <span className="font-bold text-sm tracking-wide">DESIGN NEW STRATEGY</span>
            </button>

            {strategies.map(strategy => (
              <div 
                key={strategy.id} 
                className="glass-card rounded-2xl p-5 hover:border-brand-500/30 transition-all group cursor-pointer"
                onClick={() => setSelectedStrategyDetail(strategy)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-brand-400 transition-colors">{strategy.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${strategy.active ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{strategy.active ? 'Active' : 'Paused'}</span>
                      <div className="h-3 w-px bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400"><Target size={12} className="text-brand-500" /><span className="text-white font-mono font-bold">{strategy.strikeRate || 0}%</span> WR</div>
                      <div className="h-3 w-px bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">ROI: <span className={`${(strategy.roi||0) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>{strategy.roi || 0}%</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleStrategy(strategy.id)} className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${strategy.active ? 'bg-brand-600' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${strategy.active ? 'translate-x-5' : ''}`}></div>
                    </button>
                    <button onClick={() => deleteStrategy(strategy.id)} className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                   <div className="px-3 py-2 bg-slate-950/50 rounded-lg border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Target</span>
                      <span className="text-xs font-bold text-brand-400 truncate ml-2">{strategy.targetOutcome}</span>
                   </div>
                   {strategy.avgOdds && strategy.avgOdds > 0 && (
                     <div className="px-3 py-2 bg-slate-950/50 rounded-lg border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Avg Odds</span>
                        <span className="text-xs font-bold text-indigo-400">{strategy.avgOdds}</span>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'alerts' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             {betTickets.filter(t => t.status === 'PENDING').length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> Active Bets
                 </h3>
                 {betTickets.filter(t => t.status === 'PENDING').map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedAlertTicket(ticket)}
                      className="glass-card border-brand-500/30 rounded-xl p-4 flex justify-between items-center relative overflow-hidden group cursor-pointer hover:bg-slate-800/50 transition-colors"
                    >
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-brand-500"></div>
                       <div>
                          <div className="text-sm font-bold text-white mb-1">{ticket.homeTeam} <span className="text-slate-500">vs</span> {ticket.awayTeam}</div>
                          <div className="flex items-center gap-2">
                             <div className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-bold uppercase border border-brand-500/20">{ticket.targetOutcome}</div>
                             <span className="text-[10px] text-slate-500">@ {ticket.oddsAtTrigger}</span>
                          </div>
                       </div>
                       <div className="text-right">
                         <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Status</div>
                         <div className="text-xs text-brand-400 font-mono animate-pulse">TRACKING</div>
                       </div>
                    </div>
                 ))}
               </div>
             )}
             {betTickets.filter(t => t.status !== 'PENDING').length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Outcomes</h3>
                 {betTickets.filter(t => t.status !== 'PENDING').reverse().slice(0, 5).map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedAlertTicket(ticket)}
                      className={`rounded-xl p-4 flex justify-between items-center border cursor-pointer hover:brightness-110 transition-all ${ticket.status === 'WON' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                    >
                       <div>
                          <div className="text-sm font-bold text-white mb-1">{ticket.homeTeam} <span className="text-slate-500">vs</span> {ticket.awayTeam}</div>
                          <div className={`text-[10px] font-bold uppercase inline-block ${ticket.status === 'WON' ? 'text-emerald-400' : 'text-red-400'}`}>{ticket.targetOutcome}</div>
                       </div>
                       <div className="text-right">
                          <div className={`text-xs font-bold px-3 py-1 rounded-full border ${ticket.status === 'WON' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{ticket.status}</div>
                          <div className="text-[10px] text-slate-600 mt-1 font-mono">Odds: {ticket.oddsAtTrigger}</div>
                       </div>
                    </div>
                 ))}
               </div>
             )}
           </div>
        )}
      </main>

      {isBuilderOpen && <StrategyBuilder onSave={addStrategy} onCancel={() => setIsBuilderOpen(false)} />}
      
      {selectedStrategyDetail && (
        <StrategyDetailsModal 
          strategy={selectedStrategyDetail} 
          onClose={() => setSelectedStrategyDetail(null)} 
        />
      )}
      
      {selectedAlertTicket && (
        <AlertDetailsModal 
          ticket={selectedAlertTicket} 
          onClose={() => setSelectedAlertTicket(null)} 
        />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={apiSettings} onSave={saveSettings} />

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full flex justify-around p-2 z-40 shadow-2xl shadow-black/50">
        <button onClick={() => setView('matches')} className={`relative p-3 rounded-full transition-all duration-300 ${view === 'matches' ? 'text-white bg-brand-600 shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white'}`}>
          <Home size={20} />
          {view === 'matches' && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-brand-400 tracking-wider uppercase animate-in fade-in slide-in-from-top-1">Live</span>}
        </button>
        <button onClick={() => setView('strategies')} className={`relative p-3 rounded-full transition-all duration-300 ${view === 'strategies' ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
          <LayoutDashboard size={20} />
          {view === 'strategies' && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-400 tracking-wider uppercase animate-in fade-in slide-in-from-top-1">Strats</span>}
        </button>
        <button onClick={() => setView('market')} className={`relative p-3 rounded-full transition-all duration-300 ${view === 'market' ? 'text-white bg-purple-600 shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}>
          <ShoppingBag size={20} />
          {view === 'market' && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-400 tracking-wider uppercase animate-in fade-in slide-in-from-top-1">Store</span>}
        </button>
        <button onClick={() => setView('alerts')} className={`relative p-3 rounded-full transition-all duration-300 ${view === 'alerts' ? 'text-white bg-orange-600 shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'}`}>
          <div className="relative"><Bell size={20} />{notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>}</div>
          {view === 'alerts' && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-orange-400 tracking-wider uppercase animate-in fade-in slide-in-from-top-1">Alerts</span>}
        </button>
      </nav>
    </div>
  );
}

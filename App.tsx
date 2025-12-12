
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bell, Home, Settings, PlusCircle, Trash2, List, Wifi, AlertTriangle, Search, Filter, LogOut, Shield, ShoppingBag, Target, Menu, LayoutDashboard, Wallet, CreditCard, Globe, X, DollarSign, Pencil, User as UserIcon } from 'lucide-react';

import { Match, AlertStrategy, NotificationLog, CriteriaMetric, Operator, ApiSettings, User, TargetOutcome, BetTicket, ToastMessage, MarketStrategy } from './types';
import { fetchLiveMatches } from './services/footballApi';
import { getCurrentUser, logout } from './services/authService';
import { db } from './services/db';
import { getStrategyLimit, canAccessAdminPanel } from './services/permissions';
import { ALERT_SOUND_DATA_URI } from './assets/sounds';

import { MatchCard } from './components/MatchCard';
import { StrategyBuilder } from './components/StrategyBuilder';
import { SettingsModal } from './components/SettingsModal';
import { AccountSettings } from './components/AccountSettings'; // Import Account Settings
import { Logo } from './components/Logo';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { StrategyMarket } from './components/StrategyMarket';
import { StrategyDetailsModal } from './components/StrategyDetailsModal';
import { AlertDetailsModal } from './components/AlertDetailsModal';
import { Toaster } from './components/Toaster';
import { FullscreenAlert } from './components/FullscreenAlert';
import { PricingModal } from './components/PricingModal';
import { LandingPage } from './components/LandingPage';
import { TutorialOverlay } from './components/TutorialOverlay';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [showAuth, setShowAuth] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [view, setView] = useState<'matches' | 'strategies' | 'alerts' | 'market' | 'admin'>('matches');
  
  // Strategy Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [strategyToEdit, setStrategyToEdit] = useState<AlertStrategy | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // API Settings
  const [isAccountOpen, setIsAccountOpen] = useState(false); // User Profile Settings
  const [showPricing, setShowPricing] = useState(false);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [strategies, setStrategies] = useState<AlertStrategy[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [betTickets, setBetTickets] = useState<BetTicket[]>([]); 
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fullscreenAlert, setFullscreenAlert] = useState<{title: string, message: string, type: 'success' | 'alert'} | null>(null);

  const [selectedStrategyDetail, setSelectedStrategyDetail] = useState<AlertStrategy | null>(null);
  const [selectedAlertTicket, setSelectedAlertTicket] = useState<BetTicket | null>(null);
  
  // Publish Existing Modal State
  const [strategyToPublish, setStrategyToPublish] = useState<AlertStrategy | null>(null);
  const [publishPrice, setPublishPrice] = useState(0);
  const [publishDesc, setPublishDesc] = useState('');
  const [publishFree, setPublishFree] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>({ userId: '', apiKey: '', refreshRate: 60, useDemoData: true, primaryProvider: 'api-football' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [liveOnly, setLiveOnly] = useState(true);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(ALERT_SOUND_DATA_URI);
    audioRef.current.load();
  }, []);

  // NEW: Check if first time user for tutorial
  useEffect(() => {
    if (currentUser && !localStorage.getItem('tutorial_completed')) {
      setShowTutorial(true);
    }
  }, [currentUser]);

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_completed', 'true');
  };

  // CHECK SUBSCRIPTION STATUS
  useEffect(() => {
    if (currentUser) {
       const isExpired = currentUser.subscription.expiryDate < Date.now();
       if (isExpired && currentUser.subscription.status !== 'active') {
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
  }, [currentUser?.id]);

  const playAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio blocked. User must interact with document first.", e));
    }
  };

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && currentUser) {
      const registerSW = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('SW Registered');
        } catch (e) {
          console.warn('SW Registration Skipped:', e);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
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
    // SECURITY/QUOTA: Do not fetch if browser is minimized or user inactive to save quota
    if (!currentUser || showPricing || document.hidden) return; 
    
    setLoading(true);
    try {
      const data = await fetchLiveMatches(apiSettings.apiKey, apiSettings.useDemoData, apiSettings);
      setMatches(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch matches. Please check settings or connection.");
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

  // --- CORE ENGINE ---
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
          // Simple fallback mapping for demo
          let actualValue = 0;
          if (criteria.metric === CriteriaMetric.TIME) actualValue = match.minute;
          if (criteria.metric === CriteriaMetric.GOALS_TOTAL) actualValue = home.goals + away.goals;
          if (criteria.metric === CriteriaMetric.DA_TOTAL) actualValue = (home.dangerousAttacks||0) + (away.dangerousAttacks||0);
          
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
           
           db.strategies.logAlert();

           let ticketOdds = 1.90; 
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
        }
      });

      if (triggeredNow.length > 0) {
        return { ...strategy, triggeredMatches: [...strategy.triggeredMatches, ...triggeredNow] };
      }
      return strategy;
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      setBetTickets(prev => [...prev, ...newTickets]);
      setStrategies(updatedStrategies);
      updatedStrategies.forEach(s => db.strategies.update(s));
    }
  }, [matches, currentUser]);

  const saveStrategy = async (strategy: AlertStrategy) => {
    if (!currentUser) return;
    const existingIndex = strategies.findIndex(s => s.id === strategy.id);
    const limit = getStrategyLimit(currentUser);
    
    if (existingIndex === -1 && strategies.length >= limit) {
       addToast("Limit Reached", `You can only have ${limit} active strategies.`, "warning");
       setShowPricing(true);
       return;
    }

    const withUserId = { ...strategy, userId: currentUser.id };
    
    if (existingIndex >= 0) {
       await db.strategies.update(withUserId);
       const updated = [...strategies];
       updated[existingIndex] = withUserId;
       setStrategies(updated);
       addToast("Updated", `Strategy "${strategy.name}" updated successfully.`, "success");
    } else {
       const saved = await db.strategies.create(withUserId);
       setStrategies([...strategies, saved]);
       addToast("Created", `Strategy "${strategy.name}" created successfully.`, "success");
    }

    if (withUserId.isPublic) {
      const marketStrat: MarketStrategy = {
        ...withUserId,
        author: currentUser.username,
        copyCount: existingIndex >= 0 ? 0 : 0, 
        description: withUserId.description || 'No description provided.',
        price: withUserId.price || 0
      };
      await db.market.create(marketStrat);
      if(!existingIndex) addToast('Published!', `"${strategy.name}" is now on the marketplace.`, 'success');
    }

    setIsBuilderOpen(false);
    setStrategyToEdit(null);
  };

  const publishExisting = async () => {
    if(!strategyToPublish || !currentUser) return;
    
    const marketStrat: MarketStrategy = {
      ...strategyToPublish,
      userId: currentUser.id,
      isPublic: true,
      price: publishFree ? 0 : publishPrice,
      description: publishDesc,
      author: currentUser.username,
      copyCount: 0
    };

    const updatedLocal = { ...strategyToPublish, isPublic: true, price: marketStrat.price, description: marketStrat.description };
    await db.strategies.update(updatedLocal);
    await db.market.create(marketStrat);
    setStrategies(strategies.map(s => s.id === updatedLocal.id ? updatedLocal : s));
    
    addToast('Published!', `"${strategyToPublish.name}" is live on the marketplace.`, 'success');
    setStrategyToPublish(null);
  };

  const deleteStrategy = async (id: string) => {
    if(!window.confirm("Are you sure you want to delete this strategy?")) return;
    await db.strategies.delete(id);
    setStrategies(prev => prev.filter(s => s.id !== id));
  };

  const toggleStrategy = async (id: string) => {
    const updated = strategies.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setStrategies(updated);
    const target = updated.find(s => s.id === id);
    if(target) await db.strategies.update(target);
  };

  const handleEditStrategy = (strategy: AlertStrategy) => {
    setStrategyToEdit(strategy);
    setIsBuilderOpen(true);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setShowAuth(false);
  };

  // --- RENDER FLOW ---

  if (!currentUser && !showAuth) {
    return <LandingPage onLogin={() => setShowAuth(true)} />;
  }

  if (!currentUser && showAuth) {
    return (
      <div className="relative">
        <button onClick={() => setShowAuth(false)} className="absolute top-4 left-4 z-50 text-white flex items-center gap-2 text-sm font-bold bg-black/20 p-2 rounded-lg hover:bg-black/40"><X size={16}/> Back</button>
        <Auth onSuccess={(user) => { setCurrentUser(user); setShowAuth(false); }} />
      </div>
    );
  }

  // --- Filters ---
  const leagues = Array.from(new Set(matches.map(m => m.league)));
  const filteredMatches = matches.filter(m => {
    const matchesSearch = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.league.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'All' || m.league === selectedLeague;
    const matchesLive = liveOnly ? m.status === 'Live' : true;
    return matchesSearch && matchesLeague && matchesLive;
  });

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 font-sans selection:bg-brand-500/30">
      
      {showTutorial && <TutorialOverlay onComplete={completeTutorial} />}

      {showPricing && (
         <PricingModal 
           user={currentUser!} 
           onSuccess={(u) => { setCurrentUser(u); setShowPricing(false); }} 
         />
      )}

      {/* Publish Existing Modal */}
      {strategyToPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-white">Publish Strategy</h3>
                 <button onClick={() => setStrategyToPublish(null)}><X size={20} className="text-slate-500" /></button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                 List <strong>{strategyToPublish.name}</strong> on the public marketplace.
              </p>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                    <textarea 
                       value={publishDesc}
                       onChange={e => setPublishDesc(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-brand-500 focus:outline-none"
                       rows={3}
                       placeholder="Describe the logic (e.g. late goals in high xG games)"
                    ></textarea>
                 </div>
                 <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price ($)</label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={publishFree} 
                           onChange={e => { setPublishFree(e.target.checked); if(e.target.checked) setPublishPrice(0); }} 
                           className="accent-brand-500" 
                        />
                        <span className="text-xs font-bold text-emerald-400">List for Free</span>
                     </label>
                 </div>
                 <div className="relative">
                     <DollarSign size={14} className={`absolute left-3 top-3 ${publishFree ? 'text-slate-600' : 'text-slate-500'}`} />
                     <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={publishPrice}
                        onChange={(e) => { setPublishPrice(Number(e.target.value)); setPublishFree(Number(e.target.value) === 0); }}
                        disabled={publishFree}
                        className={`w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:border-brand-500 focus:outline-none ${publishFree ? 'opacity-50' : ''}`}
                     />
                 </div>
                 <button 
                   onClick={publishExisting}
                   disabled={!publishDesc.trim()}
                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Globe size={16} /> Publish Now
                 </button>
              </div>
           </div>
        </div>
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
           <button onClick={() => setIsAccountOpen(true)} className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700 hover:border-brand-500/50 transition-colors">
              <Wallet size={14} className="text-brand-500" />
              <span className="text-xs font-bold text-white font-mono">${currentUser!.walletBalance.toFixed(2)}</span>
           </button>

           {canAccessAdminPanel(currentUser) && (
             <>
               <button onClick={() => setView('admin')} className={`p-2 rounded-lg transition-all ${view === 'admin' ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <Shield size={20} />
               </button>
               <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="API Settings">
                  <Settings size={20} />
               </button>
             </>
           )}
          
          <button onClick={() => setIsAccountOpen(true)} className="p-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-brand-500 transition-colors" title="Account & Profile">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-900">
               {currentUser!.username.charAt(0).toUpperCase()}
            </div>
          </button>

          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Logout">
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

        {view === 'admin' && canAccessAdminPanel(currentUser) && <AdminDashboard settings={apiSettings} onBroadcast={addToast} />}
        {view === 'market' && <StrategyMarket onImport={saveStrategy} />}

        {view === 'matches' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* MATCH FILTERS */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
               <div className="relative group flex-1">
                 <input 
                   type="text" placeholder="Search teams..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500/50 transition-all text-white placeholder-slate-500 shadow-lg"
                 />
                 <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={16} />
               </div>
               
               <div className="flex gap-2">
                  <select 
                    value={selectedLeague} 
                    onChange={e => setSelectedLeague(e.target.value)}
                    className="bg-slate-900/60 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none cursor-pointer"
                  >
                     <option value="All">All Leagues</option>
                     {leagues.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>

                  <button 
                    onClick={() => setLiveOnly(!liveOnly)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${liveOnly ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                  >
                     {liveOnly ? 'Live Only' : 'All Matches'}
                  </button>
               </div>
            </div>

            <div className="flex justify-between items-center mb-4 px-2">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-brand-500 animate-ping' : 'bg-slate-600'}`}></span> 
                 {filteredMatches.length} Matches Found
               </h2>
               <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                     {apiSettings.useDemoData ? 'Simulation Mode' : (apiSettings.primaryProvider === 'sportmonks' ? 'SportMonks Live' : 'API-Football Live')}
                  </span>
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
                 {filteredMatches.length === 0 && (
                    <div className="text-center py-12 text-slate-600 text-sm">
                       No matches found matching your filters.
                    </div>
                 )}
               </div>
            )}
          </div>
        )}

        {view === 'strategies' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setStrategyToEdit(null); setIsBuilderOpen(true); }} className="w-full py-6 bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center gap-3 group shadow-lg">
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
                    <h3 className="font-bold text-white text-lg group-hover:text-brand-400 transition-colors flex items-center gap-2">
                      {strategy.name}
                      {strategy.isPublic && <Globe size={12} className="text-indigo-400" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${strategy.active ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{strategy.active ? 'Active' : 'Paused'}</span>
                      <div className="h-3 w-px bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400"><Target size={12} className="text-brand-500" /><span className="text-white font-mono font-bold">{strategy.strikeRate || 0}%</span> WR</div>
                      <div className="h-3 w-px bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">ROI: <span className={`${(strategy.roi||0) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>{strategy.roi || 0}%</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleEditStrategy(strategy); }}
                        className="text-slate-600 hover:text-brand-400 p-1.5 hover:bg-brand-500/10 rounded-lg transition-colors"
                        title="Edit Strategy"
                      >
                         <Pencil size={18} />
                    </button>
                    {!strategy.isPublic && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setStrategyToPublish(strategy); setPublishDesc(''); setPublishPrice(0); setPublishFree(true); }}
                        className="text-slate-600 hover:text-indigo-400 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Publish to Marketplace"
                      >
                         <Globe size={18} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); toggleStrategy(strategy.id); }} className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${strategy.active ? 'bg-brand-600' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${strategy.active ? 'translate-x-5' : ''}`}></div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteStrategy(strategy.id); }} className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
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

      {isBuilderOpen && (
        <StrategyBuilder 
           initialData={strategyToEdit} 
           onSave={saveStrategy} 
           onCancel={() => { setIsBuilderOpen(false); setStrategyToEdit(null); }} 
        />
      )}
      
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
      
      <AccountSettings 
         isOpen={isAccountOpen} 
         onClose={() => setIsAccountOpen(false)} 
         user={currentUser!}
         onUpdate={setCurrentUser}
      />

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

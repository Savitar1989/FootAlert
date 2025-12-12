
import React, { useState, useEffect } from 'react';
import { MarketStrategy, AlertStrategy, User } from '../types';
import { Download, Star, Search, ShieldCheck, DollarSign, Lock, RefreshCw, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { StrategyDetailsModal } from './StrategyDetailsModal';
import { getCurrentUser } from '../services/authService';
import { buyStrategy } from '../services/paymentService';
import { RealStripePayment } from './RealStripePayment';
import { db } from '../services/db';
import { canDeleteMarketItem } from '../services/permissions';

interface StrategyMarketProps {
  onImport: (strategy: AlertStrategy) => void;
}

export const StrategyMarket: React.FC<StrategyMarketProps> = ({ onImport }) => {
  const [filter, setFilter] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<MarketStrategy | null>(null);
  const [marketStrategies, setMarketStrategies] = useState<MarketStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Payment State
  const [buyingStrategy, setBuyingStrategy] = useState<MarketStrategy | null>(null);

  const currentUser = getCurrentUser();

  const loadMarket = async () => {
    setLoading(true);
    const data = await db.market.getAll();
    setMarketStrategies(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMarket();
  }, []);

  const strategies = marketStrategies.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase()) || 
    s.author.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAction = async (e: React.MouseEvent, marketStrat: MarketStrategy) => {
    e.stopPropagation();
    
    // If free, just import
    if (marketStrat.price === 0) {
      importStrategy(marketStrat);
    } else {
      // Open Payment Modal
      setBuyingStrategy(marketStrat);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this strategy from the marketplace?")) {
      await db.market.delete(id);
      loadMarket();
    }
  };

  const importStrategy = (marketStrat: MarketStrategy) => {
    const newStrategy: AlertStrategy = {
      id: uuidv4(),
      userId: '', // Will be set by App
      name: `Copy of ${marketStrat.name}`,
      active: true,
      criteria: marketStrat.criteria,
      targetOutcome: marketStrat.targetOutcome,
      triggeredMatches: [],
      wins: 0,
      totalHits: 0,
      strikeRate: 0,
      avgOdds: 0,
      roi: 0,
      history: [],
      price: 0,
      isPublic: false
    };
    onImport(newStrategy);
    alert(`Successfully added "${marketStrat.name}" to your library!`);
  };

  const handlePurchaseSuccess = async () => {
    if (buyingStrategy && currentUser) {
      try {
        await buyStrategy(currentUser, buyingStrategy);
        importStrategy(buyingStrategy);
        setBuyingStrategy(null);
      } catch (e) {
        alert("Purchase failed. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Payment Modal */}
      {buyingStrategy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
           <RealStripePayment 
              amount={buyingStrategy.price}
              description={`Strategy: ${buyingStrategy.name}`}
              onSuccess={handlePurchaseSuccess}
              onCancel={() => setBuyingStrategy(null)}
           />
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-indigo-500/30">
         <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" /> Strategy Marketplace
            </h2>
            <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
              Unlock the power of the community. Clone high-performance algorithms tested by thousands of matches.
            </p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative group flex-1">
          <input 
             type="text" 
             placeholder="Search strategies..."
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
             className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder-slate-500 shadow-lg"
          />
          <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
        </div>
        <button onClick={loadMarket} className="bg-slate-900/60 border border-white/10 rounded-xl px-4 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading market data...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {strategies.map(strat => (
            <div 
              key={strat.id} 
              onClick={() => setSelectedStrategy(strat)}
              className="glass-card rounded-2xl p-6 hover:border-indigo-500/30 transition-all group shadow-lg hover:shadow-indigo-500/10 cursor-pointer relative"
            >
               {currentUser && canDeleteMarketItem(currentUser, strat) && (
                 <button 
                   onClick={(e) => handleDelete(e, strat.id)}
                   className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors z-20"
                   title="Delete Strategy"
                 >
                   <Trash2 size={16} />
                 </button>
               )}

               <div className="flex justify-between items-start mb-4 pr-8">
                  <div>
                     <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{strat.name}</h3>
                     <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span>by <span className="text-slate-300 font-medium">{strat.author}</span></span>
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        <span>{strat.copyCount} imports</span>
                     </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${strat.price === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                     {strat.price === 0 ? 'Free' : `$${strat.price}`}
                  </span>
               </div>

               <p className="text-xs text-slate-400 mb-5 line-clamp-2 leading-relaxed h-8">
                 {strat.description}
               </p>

               <div className="grid grid-cols-3 gap-3 mb-5 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <div className="text-center border-r border-white/5">
                     <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Strike Rate</div>
                     <div className="text-sm font-bold text-emerald-400">{strat.strikeRate}%</div>
                  </div>
                  <div className="text-center border-r border-white/5">
                     <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Avg Odds</div>
                     <div className="text-sm font-bold text-indigo-400">{strat.avgOdds || '-'}</div>
                  </div>
                  <div className="text-center">
                     <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">ROI</div>
                     <div className={`text-sm font-bold ${(strat.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{strat.roi || 0}%</div>
                  </div>
               </div>

               <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5">
                     Bet: <span className="text-indigo-300 font-bold ml-1">{strat.targetOutcome}</span>
                  </div>
                  <button 
                    onClick={(e) => handleAction(e, strat)}
                    className={`px-5 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-lg transform hover:-translate-y-0.5 ${strat.price === 0 ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'}`}
                  >
                    {strat.price === 0 ? <Download size={14} /> : <Lock size={14} />} 
                    {strat.price === 0 ? 'Import' : 'Buy Now'}
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedStrategy && (
        <StrategyDetailsModal 
          strategy={selectedStrategy} 
          onClose={() => setSelectedStrategy(null)} 
          isMarket
        />
      )}
    </div>
  );
};

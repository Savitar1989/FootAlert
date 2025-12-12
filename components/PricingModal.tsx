
import React, { useState } from 'react';
import { User } from '../types';
import { Check, Shield, Zap, Star, Lock } from 'lucide-react';
import { RealStripePayment } from './RealStripePayment';
import { processSubscription } from '../services/paymentService';

interface PricingModalProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ user, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);

  const plans = {
    weekly: { id: 'weekly', price: 5, name: 'Weekly Pass', label: '7 Days Access' },
    monthly: { id: 'monthly', price: 15, name: 'Pro Monthly', label: '30 Days Access' }
  };

  const handlePaymentSuccess = async () => {
    try {
       const updated = await processSubscription(user, selectedPlan);
       onSuccess(updated);
    } catch (e) {
       alert("Subscription failed. Please try again.");
    }
  };

  if (showCheckout) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
        <RealStripePayment 
           amount={plans[selectedPlan].price} 
           description={`FootAlert ${plans[selectedPlan].name}`}
           onSuccess={handlePaymentSuccess}
           onCancel={() => setShowCheckout(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in">
       <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          
          {/* Left: Value Prop */}
          <div className="p-10 bg-gradient-to-br from-brand-900 to-slate-900 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-brand-500/20">
                 <Star size={12} fill="currentColor" /> Premium Access
               </div>
               <h2 className="text-4xl font-black text-white mb-4 leading-tight">Upgrade your game. <br/><span className="text-brand-400">Beat the bookies.</span></h2>
               <p className="text-slate-300 text-sm leading-relaxed mb-8">
                 Your trial has expired. To continue accessing real-time algorithms, instant alerts, and the strategy marketplace, please choose a plan.
               </p>
             </div>

             <div className="space-y-4">
                {[
                  'Unlimited Real-Time Alerts',
                  'Access Strategy Marketplace',
                  'Telegram Push Notifications',
                  'Sell Your Strategies (15% fee)',
                  'Advanced xG & Pressure Stats'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-white font-medium">
                     <div className="p-1 bg-brand-500 rounded-full text-slate-900"><Check size={12} strokeWidth={4} /></div>
                     {feat}
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Plans */}
          <div className="p-10 bg-slate-950 flex flex-col justify-center">
             <h3 className="text-xl font-bold text-white mb-6 text-center">Choose your plan</h3>
             
             <div className="space-y-4 mb-8">
                {/* Weekly */}
                <div 
                  onClick={() => setSelectedPlan('weekly')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPlan === 'weekly' ? 'border-brand-500 bg-brand-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'weekly' ? 'border-brand-500' : 'border-slate-600'}`}>
                         {selectedPlan === 'weekly' && <div className="w-3 h-3 bg-brand-500 rounded-full"></div>}
                      </div>
                      <div>
                         <div className="font-bold text-white">Weekly Pass</div>
                         <div className="text-xs text-slate-500">Billed every 7 days</div>
                      </div>
                   </div>
                   <div className="text-xl font-bold text-white">$5</div>
                </div>

                {/* Monthly */}
                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center relative overflow-hidden ${selectedPlan === 'monthly' ? 'border-brand-500 bg-brand-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                >
                   {selectedPlan === 'monthly' && <div className="absolute top-0 right-0 bg-brand-500 text-slate-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg">BEST VALUE</div>}
                   <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-brand-500' : 'border-slate-600'}`}>
                         {selectedPlan === 'monthly' && <div className="w-3 h-3 bg-brand-500 rounded-full"></div>}
                      </div>
                      <div>
                         <div className="font-bold text-white">Pro Monthly</div>
                         <div className="text-xs text-slate-500">Billed every 30 days</div>
                      </div>
                   </div>
                   <div className="text-xl font-bold text-white">$15</div>
                </div>
             </div>

             <button 
               onClick={() => setShowCheckout(true)}
               className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/40 transition-all flex items-center justify-center gap-2 group"
             >
                <Zap className="group-hover:fill-white transition-colors" size={20} />
                Continue to Secure Checkout
             </button>
             
             <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
               <Lock size={12} /> Encrypted Payment by Stripe
             </div>
          </div>
       </div>
    </div>
  );
};

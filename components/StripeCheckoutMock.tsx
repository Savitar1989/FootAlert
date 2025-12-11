

import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';

interface StripeCheckoutMockProps {
  amount: number;
  description: string;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export const StripeCheckoutMock: React.FC<StripeCheckoutMockProps> = ({ amount, description, onSuccess, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    await onSuccess();
    setProcessing(false);
    setComplete(true);
  };

  if (complete) {
    return (
      <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful</h3>
        <p className="text-slate-500 text-sm mb-6">Your transaction has been confirmed.</p>
        <div className="w-full bg-slate-100 rounded-lg p-3 text-xs font-mono text-slate-500 mb-2">
           TX ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-md w-full">
      <div className="bg-[#635BFF] p-6 text-white flex justify-between items-center">
        <div>
           <div className="font-bold text-lg mb-1">{description}</div>
           <div className="text-indigo-200 text-sm">FootAlert Secure Checkout</div>
        </div>
        <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Card Information</label>
          <div className="border border-slate-300 rounded-md px-3 py-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#635BFF] focus-within:border-[#635BFF] transition-all">
             <CreditCard size={20} className="text-slate-400" />
             <input type="text" placeholder="Card number" className="flex-1 outline-none text-slate-700 placeholder-slate-400" defaultValue="4242 4242 4242 4242" />
             <div className="flex gap-2">
                <input type="text" placeholder="MM/YY" className="w-16 outline-none text-slate-700 placeholder-slate-400 text-center" defaultValue="12/26" />
                <input type="text" placeholder="CVC" className="w-12 outline-none text-slate-700 placeholder-slate-400 text-center" defaultValue="123" />
             </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Cardholder Name</label>
          <input type="text" className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF] shadow-sm text-slate-700" placeholder="Full Name" defaultValue="John Doe" />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
           <Lock size={12} className="text-green-600" />
           Payments are securely processed by Stripe.
        </div>

        <button 
          type="submit" 
          disabled={processing}
          className="w-full py-3 bg-[#635BFF] hover:bg-[#534be0] text-white font-bold rounded-md shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2 mt-2"
        >
          {processing ? <Loader2 className="animate-spin" /> : `Pay $${amount.toFixed(2)}`}
        </button>
        
        <button type="button" onClick={onCancel} className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold">
           Cancel Payment
        </button>
      </form>
    </div>
  );
};

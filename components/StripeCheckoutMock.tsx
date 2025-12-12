
import React, { useState } from 'react';
import { Lock, CheckCircle, Loader2, CreditCard } from 'lucide-react';

interface StripeCheckoutMockProps {
  amount: number;
  description: string;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export const StripeCheckoutMock: React.FC<StripeCheckoutMockProps> = ({ amount, description, onSuccess, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'card' | 'apple'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // Simulate backend handshake and stripe processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await onSuccess();
    setProcessing(false);
    setComplete(true);
  };

  if (complete) {
    return (
      <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in w-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Confirmed</h3>
        <p className="text-slate-500 text-sm mb-6">Your transaction was successful.</p>
        <div className="w-full bg-slate-100 rounded-lg p-3 text-xs font-mono text-slate-500 mb-2">
           TX: {Math.random().toString(36).substring(7).toUpperCase()}_STRIPE_SUCCESS
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-auto animate-in fade-in zoom-in-95">
      {/* Stripe Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
         <div className="flex items-center gap-2">
            <div className="font-bold text-slate-700 text-sm">Pay <span className="font-black">FootAlert</span></div>
         </div>
         <div className="font-mono font-bold text-slate-900">${amount.toFixed(2)}</div>
      </div>

      <div className="p-6">
         <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Payment Method</label>
            <div className="flex gap-2">
               <button 
                 onClick={() => setActiveMethod('card')}
                 className={`flex-1 py-2 rounded border flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeMethod === 'card' ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF] ring-1 ring-[#635BFF]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
               >
                  <CreditCard size={16} /> Card
               </button>
               <button 
                 onClick={() => setActiveMethod('apple')}
                 className={`flex-1 py-2 rounded border flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeMethod === 'apple' ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
               >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.86-1.06 1.44-2.53 1.28-3.99-1.24.05-2.74.83-3.63 1.89-.79.95-1.48 2.48-1.29 3.93 1.38.11 2.78-.77 3.64-1.83"/></svg>
                  Pay
               </button>
            </div>
         </div>

         {activeMethod === 'card' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Card Information</label>
                  <div className="border border-slate-300 rounded-md shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#635BFF] focus-within:border-[#635BFF] transition-all">
                     <div className="flex items-center px-3 py-2.5 border-b border-slate-200 bg-white">
                        <CreditCard size={18} className="text-slate-400 mr-2" />
                        <input type="text" placeholder="Number" className="flex-1 outline-none text-sm text-slate-900 placeholder-slate-400" defaultValue="4242 4242 4242 4242" />
                     </div>
                     <div className="flex bg-white">
                        <input type="text" placeholder="MM / YY" className="w-1/2 px-3 py-2.5 border-r border-slate-200 outline-none text-sm text-slate-900 placeholder-slate-400" defaultValue="12 / 28" />
                        <input type="text" placeholder="CVC" className="w-1/2 px-3 py-2.5 outline-none text-sm text-slate-900 placeholder-slate-400" defaultValue="123" />
                     </div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Billing Name</label>
                  <input type="text" className="w-full border border-slate-300 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF] shadow-sm text-sm text-slate-900" placeholder="Full Name" defaultValue="John Doe" />
               </div>

               <button 
                  type="submit" 
                  disabled={processing}
                  className="w-full py-3 bg-[#635BFF] hover:bg-[#534be0] text-white font-bold rounded-md shadow-md transition-all flex justify-center items-center gap-2 mt-4"
               >
                  {processing ? <Loader2 className="animate-spin" size={20} /> : `Pay $${amount.toFixed(2)}`}
               </button>
            </form>
         ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <div className="p-4 bg-slate-100 rounded-full">
                  <svg className="w-12 h-12 fill-slate-900" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.86-1.06 1.44-2.53 1.28-3.99-1.24.05-2.74.83-3.63 1.89-.79.95-1.48 2.48-1.29 3.93 1.38.11 2.78-.77 3.64-1.83"/></svg>
               </div>
               <p className="text-sm text-slate-500 text-center px-8">Confirm the payment of <strong>${amount.toFixed(2)}</strong> using Touch ID or Face ID.</p>
               <button 
                  onClick={handleSubmit} 
                  disabled={processing}
                  className="w-full py-3 bg-black hover:bg-slate-900 text-white font-bold rounded-md shadow-md transition-all flex justify-center items-center gap-2"
               >
                  {processing ? <Loader2 className="animate-spin" size={20} /> : 'Confirm with Apple Pay'}
               </button>
            </div>
         )}

         <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Lock size={10} /> Powered by <strong className="text-slate-500">Stripe</strong>
         </div>
      </div>
      
      {/* Footer Cancel */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
         <button onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Cancel and Return
         </button>
      </div>
    </div>
  );
};

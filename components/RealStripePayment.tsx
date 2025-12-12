import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StripeCheckoutMock } from './StripeCheckoutMock';

// REPLACE WITH YOUR PUBLISHABLE KEY
const STRIPE_PUBLIC_KEY = 'pk_test_TYooMQauvdEDq54NiTphI7jx'; 
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

interface RealStripePaymentProps {
  amount: number;
  description: string;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

const CheckoutForm = ({ amount, onSuccess, onError }: { amount: number, onSuccess: () => void, onError: (msg: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // In real app, handles redirect
      },
      redirect: 'if_required' // Avoid redirect for single page app flow if possible
    });

    if (error) {
      setMessage(error.message || "Payment failed");
      onError(error.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setMessage("Payment processing...");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {message && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-bold flex items-center gap-2">
           <AlertTriangle size={14} /> {message}
        </div>
      )}

      <button 
        disabled={!stripe || processing} 
        className="w-full py-3 bg-[#635BFF] hover:bg-[#534be0] text-white font-bold rounded-md shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {processing ? <Loader2 className="animate-spin" size={20} /> : `Pay $${amount.toFixed(2)}`}
      </button>
      
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
         <Lock size={10} /> Payments processed securely by <strong className="text-slate-500">Stripe</strong>
      </div>
    </form>
  );
};

export const RealStripePayment: React.FC<RealStripePaymentProps> = ({ amount, description, onSuccess, onCancel }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createIntent = async () => {
       try {
         const res = await fetch(`${API_URL}/create-payment-intent`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ amount, description }),
         });
         
         if (!res.ok) throw new Error("Backend connection refused");
         
         const data = await res.json();
         setClientSecret(data.clientSecret);
       } catch (err) {
         console.warn("Stripe Backend unreachable, switching to simulation mode.");
         // Automatically switch to fallback in development/demo without backend
         setUseFallback(true);
       }
    };
    
    createIntent();
  }, [amount, description]);

  const handleSuccess = async () => {
     await onSuccess();
  };

  if (useFallback) {
    return (
      <StripeCheckoutMock 
        amount={amount} 
        description={description} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-auto animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
         <div className="flex items-center gap-2">
            <div className="font-bold text-slate-700 text-sm">Pay <span className="font-black">FootAlert</span></div>
         </div>
         <div className="font-mono font-bold text-slate-900">${amount.toFixed(2)}</div>
      </div>

      <div className="p-6">
        {clientSecret ? (
          <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
            <CheckoutForm amount={amount} onSuccess={handleSuccess} onError={(m) => setError(m)} />
          </Elements>
        ) : error ? (
          <div className="text-center py-8">
             <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-slate-900 font-bold mb-2">Connection Error</h3>
             <p className="text-slate-500 text-sm mb-6 px-4">{error}</p>
             <button 
               onClick={() => setUseFallback(true)}
               className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700"
             >
               Switch to Simulation Mode
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
             <Loader2 className="animate-spin mb-2" size={32} />
             <span className="text-xs font-bold uppercase tracking-wider">Secure Connection...</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
         <button onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Cancel
         </button>
      </div>
    </div>
  );
};

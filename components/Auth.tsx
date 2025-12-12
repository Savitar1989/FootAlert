
import React, { useState } from 'react';
import { Logo } from './Logo';
import { login, register } from '../services/authService';
import { sendVerificationCode } from '../services/emailService';
import { User } from '../types';
import { ArrowRight, Loader2, Lock, Mail, User as UserIcon, Check } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [verificationCode, setVerificationCode] = useState('');
  const [serverCode, setServerCode] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Login Flow
    if (isLogin) {
      try {
        const user = await login(formData.username, formData.password);
        onSuccess(user);
      } catch (err: any) {
        setError(err.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Register Flow
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
         setError("Passwords do not match.");
         setLoading(false);
         return;
      }
      if (formData.password.length < 6) {
         setError("Password must be at least 6 characters.");
         setLoading(false);
         return;
      }

      try {
        // Step 1: Send verification email
        const code = await sendVerificationCode(formData.email);
        setServerCode(code);
        setStep('verify');
        setLoading(false);
      } catch(err: any) {
        setError("Could not send verification email.");
        setLoading(false);
      }
    }
  };

  const handleVerify = async () => {
    if (verificationCode !== serverCode) {
      setError("Invalid verification code.");
      return;
    }
    setLoading(true);
    try {
      const user = await register(formData.username, formData.email, formData.password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4">
      
      <div className="mb-8 scale-150 animate-in fade-in zoom-in duration-500">
        <Logo size="lg" />
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-300">
        
        {step === 'auth' ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {isLogin ? 'Welcome Back' : 'Join the Squad'}
            </h2>
            <p className="text-slate-400 text-sm text-center mb-8">
              {isLogin ? 'Sign in to access your live strategies.' : 'Create an account to start tracking matches.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none transition-colors"
                    placeholder="e.g. footalert_pro"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isLogin && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                   <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirm Password</label>
                   <div className="relative">
                     <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                     <input 
                       type="password" 
                       required
                       value={formData.confirmPassword}
                       onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none transition-colors"
                       placeholder="••••••••"
                     />
                   </div>
                 </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 mt-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg shadow-brand-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {isLogin && (
               <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-500 text-center font-mono">
                 Demo Admin: user: <strong>admin</strong> | pass: <strong>admin</strong>
               </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                   <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your Email</h2>
                <p className="text-slate-400 text-sm">
                   We sent a verification code to <strong className="text-white">{formData.email}</strong>.
                </p>
             </div>

             <div className="space-y-4">
                <input 
                   type="text" 
                   placeholder="123456" 
                   className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 text-center text-white text-2xl font-mono tracking-widest focus:border-brand-500 focus:outline-none"
                   value={verificationCode}
                   onChange={e => { setVerificationCode(e.target.value); setError(null); }}
                   maxLength={6}
                />
                
                {error && <div className="text-red-400 text-center text-xs font-bold">{error}</div>}

                <button 
                   onClick={handleVerify}
                   disabled={loading || verificationCode.length !== 6}
                   className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                </button>
                
                <button onClick={() => setStep('auth')} className="w-full text-xs text-slate-500 hover:text-white mt-2">Go Back</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

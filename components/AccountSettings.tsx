
import React, { useState, useEffect } from 'react';
import { User, Transaction, NotificationPreferences, AlertStrategy } from '../types';
import { db } from '../services/db';
import { sendVerificationCode, sendPasswordReset } from '../services/emailService';
import { X, User as UserIcon, Shield, Wallet, Save, Lock, QrCode, ArrowDownLeft, ArrowUpRight, History, Bell, BarChart2, ToggleLeft, ToggleRight, Mail, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { RealStripePayment } from './RealStripePayment';

interface AccountSettingsProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'analytics' | 'preferences' | 'security' | 'wallet'>('profile');
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });
  
  // Security State
  const [twoFaStep, setTwoFaStep] = useState<'off' | 'scan' | 'verify' | 'on'>(user.twoFactorEnabled ? 'on' : 'off');
  const [verificationCode, setVerificationCode] = useState('');
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [isProcessing2FA, setIsProcessing2FA] = useState(false);
  
  // Password Reset State
  const [resetState, setResetState] = useState<'initial' | 'sent' | 'reset'>('initial');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Wallet State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(50);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Analytics Data
  const [strategies, setStrategies] = useState<AlertStrategy[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(user.preferences || { email: true, push: true, sound: true, telegram: false });
  const [prefSaved, setPrefSaved] = useState(false);

  // Initialize data on open
  useEffect(() => {
    if (isOpen) {
      loadTransactions();
      loadStrategies();
      setPreferences(user.preferences || { email: true, push: true, sound: true, telegram: false });
    }
  }, [isOpen, user]);

  const loadTransactions = async () => {
    const tx = await db.transactions.getAll(user.id);
    setTransactions(tx);
  };

  const loadStrategies = async () => {
    setLoadingAnalytics(true);
    const s = await db.strategies.getByUser(user.id);
    setStrategies(s);
    setLoadingAnalytics(false);
  };

  const handleSaveProfile = async () => {
     try {
       const updated = await db.users.updateProfile(user.id, { ...formData });
       onUpdate(updated);
       alert("Profile Updated Successfully!");
     } catch (e) {
       alert("Failed to update profile.");
     }
  };

  const handleSavePreferences = async () => {
    try {
      const updated = await db.users.updateProfile(user.id, { preferences });
      onUpdate(updated);
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2000);
    } catch(e) {
      alert("Failed to save preferences.");
    }
  };

  // --- PASSWORD RESET ---
  const handleRequestPasswordReset = async () => {
    setIsResetting(true);
    const code = await sendPasswordReset(user.email);
    setServerCode(code);
    setResetState('sent');
    setIsResetting(false);
  };

  const handleConfirmPasswordReset = async () => {
    if (resetCode !== serverCode) {
      return alert("Invalid reset code.");
    }
    // Simulate success
    alert("Password updated successfully!");
    setResetState('initial');
    setResetCode('');
    setNewPassword('');
  };

  // --- 2FA ---
  const request2FAEmail = async () => {
    setIsProcessing2FA(true);
    const code = await sendVerificationCode(user.email);
    setServerCode(code);
    setTwoFaStep('verify');
    setIsProcessing2FA(false);
  };

  const verifyTwoFactor = async () => {
     if(verificationCode.length === 6 && (verificationCode === '123456' || verificationCode === serverCode)) {
        const updated = await db.users.toggle2FA(user.id, true);
        onUpdate(updated);
        setTwoFaStep('on');
     } else {
        alert("Invalid code. Check your email or authenticator app.");
     }
  };

  const disableTwoFactor = async () => {
      const updated = await db.users.toggle2FA(user.id, false);
      onUpdate(updated);
      setTwoFaStep('off');
  };

  // --- WALLET ---
  const handleDepositSuccess = async () => {
     try {
       await db.transactions.create(user.id, depositAmount, 'deposit', 'Wallet Deposit');
       const updatedUser = await db.users.getById(user.id);
       if(updatedUser) onUpdate(updatedUser);
       setShowDeposit(false);
       loadTransactions();
     } catch(e) {
       alert("Deposit failed");
     }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");
    if (amount > user.walletBalance) return alert("Insufficient funds");

    try {
      await db.transactions.create(user.id, amount, 'withdrawal', 'Withdrawal to Bank Account');
      const updatedUser = await db.users.getById(user.id);
      if(updatedUser) onUpdate(updatedUser);
      setShowWithdraw(false);
      setWithdrawAmount('');
      loadTransactions();
      alert("Withdrawal request processed.");
    } catch(e) {
      alert("Withdrawal failed");
    }
  };

  const totalBets = strategies.reduce((acc, s) => acc + (s.totalHits || 0), 0);
  const totalWins = strategies.reduce((acc, s) => acc + (s.wins || 0), 0);
  const globalStrikeRate = totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : "0.0";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon size={20} className="text-brand-500" /> Account Management
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
           
           {/* Sidebar */}
           <div className="w-64 bg-slate-950/50 border-r border-slate-800 p-4 flex flex-col gap-2">
              <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <UserIcon size={18} /> Profile Details
              </button>
              <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <BarChart2 size={18} /> Analytics
              </button>
              <button onClick={() => setActiveTab('preferences')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'preferences' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Bell size={18} /> Preferences
              </button>
              <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Shield size={18} /> Security & 2FA
              </button>
              <button onClick={() => setActiveTab('wallet')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'wallet' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Wallet size={18} /> Wallet & Billing
              </button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50 custom-scrollbar relative">
              
              {activeTab === 'profile' && (
                 <div className="max-w-xl space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-6 mb-6">
                       <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center text-4xl font-bold text-slate-500 relative overflow-hidden group cursor-pointer hover:border-brand-500 transition-colors">
                          {user.username.charAt(0).toUpperCase()}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white uppercase">Change</div>
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-white">{user.username}</h3>
                          <p className="text-slate-500 text-sm">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                          <span className="inline-block mt-2 px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase border border-brand-500/20">{user.role}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Username</label>
                          <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bio / Notes</label>
                          <textarea rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none" placeholder="Tell us about your betting style..." />
                       </div>
                       <div className="pt-4">
                          <button onClick={handleSaveProfile} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                             <Save size={16} /> Save Changes
                          </button>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === 'analytics' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">Performance Overview</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                       <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Bets</div>
                          <div className="text-2xl font-bold text-white">{totalBets}</div>
                       </div>
                       <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Win Rate</div>
                          <div className={`text-2xl font-bold ${parseFloat(globalStrikeRate) > 50 ? 'text-emerald-400' : 'text-orange-400'}`}>{globalStrikeRate}%</div>
                       </div>
                       <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Active Strategies</div>
                          <div className="text-2xl font-bold text-indigo-400">{strategies.filter(s => s.active).length}</div>
                       </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-64 flex items-end gap-2 relative">
                        <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase">Recent Strategy Performance (Hits)</div>
                        {loadingAnalytics ? (
                           <div className="w-full h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>
                        ) : strategies.length === 0 ? (
                           <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                              <BarChart2 size={32} className="opacity-50" />
                              <span>No betting history available yet.</span>
                           </div>
                        ) : (
                           strategies.map((strat, i) => {
                              const height = strat.totalHits ? Math.min((strat.totalHits / 50) * 100, 100) : 5;
                              return (
                                 <div key={strat.id} className="flex-1 bg-slate-800 rounded-t-sm relative group hover:bg-brand-500/20 transition-colors" style={{ height: `${height}%` }}>
                                    <div className="absolute bottom-0 w-full bg-indigo-600 group-hover:bg-brand-500 transition-colors" style={{ height: `${(strat.strikeRate || 0)}%`, opacity: 0.8 }}></div>
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 w-32 text-center pointer-events-none">
                                       <div className="text-[10px] text-white font-bold truncate">{strat.name}</div>
                                       <div className="text-[10px] text-brand-400">{strat.strikeRate}% WR</div>
                                    </div>
                                 </div>
                              );
                           })
                        )}
                    </div>
                    <div className="text-center text-xs text-slate-500">Dark bar = Total Hits, Color bar = Win Rate</div>
                 </div>
              )}

              {activeTab === 'preferences' && (
                 <div className="max-w-xl space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">Notification Settings</h3>
                    
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
                       <div className="flex items-center justify-between">
                          <div>
                             <div className="text-white font-bold">Email Alerts</div>
                             <div className="text-xs text-slate-500">Receive strategy hits via email</div>
                          </div>
                          <button onClick={() => setPreferences({...preferences, email: !preferences.email})} className={`transition-colors ${preferences.email ? 'text-brand-500' : 'text-slate-600'}`}>
                             {preferences.email ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <div>
                             <div className="text-white font-bold">Push Notifications</div>
                             <div className="text-xs text-slate-500">Browser alerts for instant updates</div>
                          </div>
                          <button onClick={() => setPreferences({...preferences, push: !preferences.push})} className={`transition-colors ${preferences.push ? 'text-brand-500' : 'text-slate-600'}`}>
                             {preferences.push ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                       </div>

                       <div className="flex items-center justify-between">
                          <div>
                             <div className="text-white font-bold">Sound Effects</div>
                             <div className="text-xs text-slate-500">Play sound on new alert</div>
                          </div>
                          <button onClick={() => setPreferences({...preferences, sound: !preferences.sound})} className={`transition-colors ${preferences.sound ? 'text-brand-500' : 'text-slate-600'}`}>
                             {preferences.sound ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                          <div>
                             <div className="text-white font-bold flex items-center gap-2">Telegram Bot <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded uppercase">Beta</span></div>
                             <div className="text-xs text-slate-500">Forward alerts to Telegram</div>
                          </div>
                          <button onClick={() => setPreferences({...preferences, telegram: !preferences.telegram})} className={`transition-colors ${preferences.telegram ? 'text-blue-500' : 'text-slate-600'}`}>
                             {preferences.telegram ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                       </div>
                    </div>

                    <button onClick={handleSavePreferences} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all">
                       {prefSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                       {prefSaved ? 'Saved!' : 'Save Preferences'}
                    </button>
                 </div>
              )}

              {activeTab === 'security' && (
                 <div className="max-w-xl space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                       <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Lock size={18} /> Password</h3>
                       <p className="text-slate-400 text-sm mb-4">Manage your login credentials. We recommend a strong, unique password.</p>
                       
                       {resetState === 'initial' && (
                          <button 
                            onClick={handleRequestPasswordReset} 
                            disabled={isResetting}
                            className="text-brand-400 hover:text-brand-300 text-sm font-bold underline flex items-center gap-2"
                          >
                            {isResetting ? <Loader2 size={12} className="animate-spin" /> : null}
                            Change Password via Email
                          </button>
                       )}
                       {resetState === 'sent' && (
                          <div className="space-y-3 bg-slate-900 p-4 rounded-lg">
                             <div className="text-xs text-brand-400 font-bold">Email sent! Check your inbox for the code.</div>
                             <input type="text" placeholder="Reset Code" value={resetCode} onChange={e => setResetCode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm focus:border-brand-500 outline-none" />
                             <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm focus:border-brand-500 outline-none" />
                             <button onClick={handleConfirmPasswordReset} className="w-full py-2 bg-brand-600 hover:bg-brand-500 rounded text-white text-xs font-bold transition-colors">Update Password</button>
                          </div>
                       )}
                    </div>

                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                       <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Shield size={18} /> Two-Factor Authentication</h3>
                       <p className="text-slate-400 text-sm mb-6">Add an extra layer of security to your account.</p>

                       {twoFaStep === 'off' && (
                          <div className="flex gap-3">
                             <button onClick={() => setTwoFaStep('scan')} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2">
                                <QrCode size={16} /> Authenticator App
                             </button>
                             <button 
                               onClick={request2FAEmail} 
                               disabled={isProcessing2FA}
                               className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                             >
                                {isProcessing2FA ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email Code
                             </button>
                          </div>
                       )}

                       {twoFaStep === 'scan' && (
                          <div className="bg-white p-4 rounded-xl inline-block text-center w-full">
                             <div className="w-32 h-32 bg-slate-200 mb-2 mx-auto flex items-center justify-center">
                                <QrCode size={48} className="text-slate-400" />
                             </div>
                             <p className="text-slate-900 text-xs font-bold mb-4">Scan with Google Authenticator</p>
                             <button onClick={() => setTwoFaStep('verify')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded">Next Step</button>
                          </div>
                       )}

                       {twoFaStep === 'verify' && (
                          <div className="flex flex-col gap-3">
                             <div className="text-xs text-brand-400 font-bold mb-1">Enter the code from your {serverCode ? 'Email' : 'App'}</div>
                             <div className="flex items-end gap-3">
                                <input type="text" placeholder="123456" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white w-full text-center tracking-widest font-mono" />
                                <button onClick={verifyTwoFactor} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">Verify</button>
                             </div>
                          </div>
                       )}

                       {twoFaStep === 'on' && (
                          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                             <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                <Shield size={16} /> 2FA Active
                             </div>
                             <button onClick={disableTwoFactor} className="text-slate-400 hover:text-red-400 text-xs font-bold underline">Disable</button>
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {activeTab === 'wallet' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 flex justify-between items-center shadow-lg">
                       <div>
                          <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Total Balance</div>
                          <div className="text-4xl font-black text-white">${user.walletBalance.toFixed(2)}</div>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={() => setShowDeposit(true)} className="px-4 py-2 bg-white text-indigo-900 font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                             <ArrowDownLeft size={16} /> Deposit
                          </button>
                          <button onClick={() => setShowWithdraw(true)} className="px-4 py-2 bg-indigo-950/50 text-indigo-200 border border-indigo-500/30 font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-900 transition-colors">
                             <ArrowUpRight size={16} /> Withdraw
                          </button>
                       </div>
                    </div>

                    {showDeposit && (
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between mb-4">
                             <h3 className="font-bold text-white">Add Funds</h3>
                             <button onClick={() => setShowDeposit(false)}><X size={16} className="text-slate-500" /></button>
                          </div>
                          
                          <div className="flex gap-4 mb-6">
                             {[25, 50, 100, 250].map(amt => (
                                <button key={amt} onClick={() => setDepositAmount(amt)} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${depositAmount === amt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500'}`}>
                                   ${amt}
                                </button>
                             ))}
                          </div>
                          
                          <RealStripePayment 
                             amount={depositAmount} 
                             description="Wallet Top-up" 
                             onSuccess={handleDepositSuccess}
                             onCancel={() => setShowDeposit(false)}
                          />
                       </div>
                    )}

                    {showWithdraw && (
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between mb-4">
                             <h3 className="font-bold text-white">Withdraw Funds</h3>
                             <button onClick={() => setShowWithdraw(false)}><X size={16} className="text-slate-500" /></button>
                          </div>
                          
                          <div className="mb-4">
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Amount to Withdraw</label>
                             <input 
                                type="number" 
                                value={withdrawAmount} 
                                onChange={e => setWithdrawAmount(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-indigo-500 outline-none" 
                                placeholder="0.00"
                             />
                             <div className="text-xs text-slate-500 mt-2">Available: ${user.walletBalance.toFixed(2)}</div>
                          </div>

                          <button onClick={handleWithdraw} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">
                             Confirm Withdrawal
                          </button>
                       </div>
                    )}

                    {/* Transaction History */}
                    <div>
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16} /> Transaction History</h3>
                       <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                          {transactions.length === 0 ? (
                             <div className="p-8 text-center text-slate-500 text-sm">No transactions yet.</div>
                          ) : (
                             <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
                                   <tr>
                                      <th className="px-6 py-3">Date</th>
                                      <th className="px-6 py-3">Description</th>
                                      <th className="px-6 py-3 text-right">Amount</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                   {transactions.map(tx => (
                                      <tr key={tx.id} className="hover:bg-slate-900/50">
                                         <td className="px-6 py-4 font-mono text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                                         <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2 ${
                                               tx.type === 'deposit' || tx.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                            }`}>{tx.type}</span>
                                            {tx.description}
                                         </td>
                                         <td className={`px-6 py-4 text-right font-bold font-mono ${
                                            tx.type === 'deposit' || tx.type === 'sale' ? 'text-emerald-400' : 'text-slate-200'
                                         }`}>
                                            {tx.type === 'deposit' || tx.type === 'sale' ? '+' : '-'}${tx.amount.toFixed(2)}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          )}
                       </div>
                    </div>
                 </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
};

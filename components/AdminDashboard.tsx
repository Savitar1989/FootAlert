
import React, { useEffect, useState } from 'react';
import { User, ApiSettings, AlertStrategy, SystemStats, AuditLog, MarketStrategy, GlobalSettings } from '../types';
import { db } from '../services/db';
import { impersonate } from '../services/authService';
import { Users, Activity, Bell, Server, Shield, Globe, Search, ArrowRight, ChevronLeft, Target, Ban, DollarSign, RotateCcw, Radio, List, Trash2, Key, Layout, Settings, Save, AlertTriangle } from 'lucide-react';
import { StrategyDetailsModal } from './StrategyDetailsModal';

interface AdminDashboardProps {
  settings: ApiSettings;
  onBroadcast: (title: string, message: string, type: 'success' | 'info' | 'warning') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, onBroadcast }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'market' | 'logs' | 'settings'>('overview');
  
  const [users, setUsers] = useState<User[]>([]);
  const [strategies, setStrategies] = useState<AlertStrategy[]>([]);
  const [marketStrategies, setMarketStrategies] = useState<MarketStrategy[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserStrategies, setSelectedUserStrategies] = useState<AlertStrategy[]>([]);
  const [viewingStrategy, setViewingStrategy] = useState<AlertStrategy | null>(null);

  const [filter, setFilter] = useState('');
  
  // Admin Action States
  const [editBalance, setEditBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Initial Load
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const u = await db.users.getAll();
    const s = await db.strategies.getAll();
    const m = await db.market.getAll();
    const stats = await db.stats.getGlobal();
    const logs = await db.audit.getAll();
    const gSettings = await db.globalSettings.get();
    
    setUsers(u);
    setStrategies(s);
    setMarketStrategies(m);
    setSystemStats(stats);
    setAuditLogs(logs);
    setGlobalSettings(gSettings);
  };

  const handleSaveGlobalSettings = async () => {
    if (globalSettings) {
      await db.globalSettings.save(globalSettings);
      await db.audit.log('admin', 'UPDATE_GLOBAL_SETTINGS', 'Updated system configuration');
      alert("System configuration saved successfully.");
    }
  };

  // Inspect User
  const handleInspectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedUserStrategies(strategies.filter(s => s.userId === user.id));
    setNewBalance(user.walletBalance);
    setEditBalance(false);
  };

  const handleBanUser = async () => {
     if(!selectedUser) return;
     const confirm = window.confirm(selectedUser.isBanned ? "Unban this user?" : "Are you sure you want to BAN this user?");
     if(confirm) {
        await db.users.adminBanUser(selectedUser.id, !selectedUser.isBanned);
        await db.audit.log('admin', selectedUser.isBanned ? 'UNBAN_USER' : 'BAN_USER', `Toggled ban status`, selectedUser.id);
        const updated = await db.users.getById(selectedUser.id);
        if(updated) setSelectedUser(updated);
        await loadData();
     }
  };

  const handleUpdateBalance = async () => {
     if(!selectedUser) return;
     await db.users.adminAdjustBalance(selectedUser.id, newBalance);
     await db.audit.log('admin', 'ADJUST_BALANCE', `Set balance to ${newBalance}`, selectedUser.id);
     const updated = await db.users.getById(selectedUser.id);
     if(updated) setSelectedUser(updated);
     setEditBalance(false);
     await loadData();
  };

  const handleImpersonate = async () => {
    if(!selectedUser) return;
    if(window.confirm(`Log in as ${selectedUser.username}? You will be redirected.`)) {
       await db.audit.log('admin', 'IMPERSONATE', `Logged in as ${selectedUser.username}`, selectedUser.id);
       await impersonate(selectedUser.id);
    }
  };

  const handleDeleteMarketItem = async (id: string) => {
    if(window.confirm("Remove this strategy from the market?")) {
       await db.market.delete(id);
       await db.audit.log('admin', 'DELETE_MARKET_ITEM', 'Removed strategy from marketplace', id);
       loadData();
    }
  };

  const handleSendBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    onBroadcast('System Alert', broadcastMsg, 'info');
    db.audit.log('admin', 'BROADCAST', `Sent: "${broadcastMsg}"`);
    setBroadcastMsg('');
    alert("Broadcast sent.");
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(filter.toLowerCase()));

  // If a user is selected, show Detail View Overlay
  if (selectedUser) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedUser(null)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-bold uppercase tracking-wider transition-colors"
        >
          <ChevronLeft size={16} /> Back to Users
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                       {selectedUser.username}
                       {selectedUser.isBanned && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">BANNED</span>}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                       <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">{selectedUser.id}</span>
                       <span>•</span>
                       <span>{selectedUser.email}</span>
                    </div>
                 </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                 <button 
                   onClick={handleImpersonate}
                   className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                 >
                    <Key size={12} /> Impersonate
                 </button>
                 <button 
                   onClick={handleBanUser}
                   className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold uppercase ${selectedUser.isBanned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border border-transparent hover:border-current transition-colors`}
                 >
                    {selectedUser.isBanned ? <RotateCcw size={12}/> : <Ban size={12}/>}
                    {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                 </button>
              </div>
           </div>

           {/* Admin Controls */}
           <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
              <div className="bg-slate-900 p-6">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Wallet Balance</h4>
                 {!editBalance ? (
                    <div className="flex justify-between items-center">
                       <span className="text-3xl font-black text-white">${selectedUser.walletBalance.toFixed(2)}</span>
                       <button onClick={() => setEditBalance(true)} className="text-brand-400 text-xs font-bold underline">Adjust</button>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={newBalance} 
                         onChange={e => setNewBalance(Number(e.target.value))}
                         className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-32"
                       />
                       <button onClick={handleUpdateBalance} className="p-2 bg-brand-600 rounded text-white"><ArrowRight size={16}/></button>
                       <button onClick={() => setEditBalance(false)} className="p-2 text-slate-400 hover:text-white"><ChevronLeft size={16}/></button>
                    </div>
                 )}
              </div>
              <div className="bg-slate-900 p-6">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security</h4>
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedUser.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                    <span className="text-slate-300 text-sm font-bold">{selectedUser.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}</span>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-slate-950/20">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Target size={16} /> Active Strategies ({selectedUserStrategies.length})
              </h3>
              
              {selectedUserStrategies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                   No strategies created by this user.
                </div>
              ) : (
                <div className="grid gap-4">
                   {selectedUserStrategies.map(strat => (
                     <div 
                       key={strat.id} 
                       onClick={() => setViewingStrategy(strat)}
                       className="glass-card p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-brand-500/30 transition-all"
                     >
                        <div>
                           <div className="font-bold text-white text-lg">{strat.name}</div>
                           <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-brand-400 font-bold">{strat.targetOutcome}</span>
                              <span className="text-slate-500">Hits: {strat.totalHits || 0}</span>
                              <span className="text-slate-500">Wins: {strat.wins || 0}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-xl font-bold font-mono ${(strat.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                             {strat.roi || 0}% ROI
                           </div>
                           <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Performance</div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {viewingStrategy && (
           <StrategyDetailsModal 
             strategy={viewingStrategy} 
             onClose={() => setViewingStrategy(null)} 
           />
        )}
      </div>
    );
  }

  // --- DASHBOARD TABS ---

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">System Command</h2>
           <p className="text-slate-400 text-sm mt-1">FootAlert Global Admin Dashboard</p>
        </div>
        <div className="px-4 py-1.5 bg-brand-900/30 border border-brand-500/30 rounded-full text-brand-400 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
           <Shield size={14} /> ENCRYPTED CONNECTION
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
         <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Overview</button>
         <button onClick={() => setActiveTab('users')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Users</button>
         <button onClick={() => setActiveTab('market')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'market' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Marketplace</button>
         <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Audit Logs</button>
         <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>System Config</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400"><Users size={22} /></div>
                 </div>
                 <div className="text-3xl font-black text-white">{systemStats?.totalUsers}</div>
                 <div className="text-xs text-slate-500 font-bold uppercase mt-1">Total Users</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400"><Activity size={22} /></div>
                 </div>
                 <div className="text-3xl font-black text-white">{systemStats?.totalStrategies}</div>
                 <div className="text-xs text-slate-500 font-bold uppercase mt-1">Active Strategies</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400"><Bell size={22} /></div>
                 </div>
                 <div className="text-3xl font-black text-white">{systemStats?.totalAlertsSent.toLocaleString()}</div>
                 <div className="text-xs text-slate-500 font-bold uppercase mt-1">Alerts Sent</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400"><Server size={22} /></div>
                 </div>
                 <div className="text-3xl font-black text-white">{systemStats?.serverLoad}%</div>
                 <div className="text-xs text-slate-500 font-bold uppercase mt-1">Server Load</div>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              {/* Traffic Chart Mock */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Globe size={16} className="text-brand-500"/> Traffic Overview</h3>
                 <div className="flex items-end gap-2 h-40">
                    {systemStats?.traffic.map((val, i) => (
                       <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative group" style={{height: `${(val / 600) * 100}%`}}>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500/50 group-hover:bg-brand-400"></div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Broadcast */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Radio size={16} className="text-red-500"/> System Broadcast</h3>
                 <textarea 
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white mb-3 h-24 resize-none focus:border-brand-500 outline-none"
                    placeholder="Message all online users..."
                 ></textarea>
                 <button onClick={handleSendBroadcast} disabled={!broadcastMsg.trim()} className="w-full py-2 bg-slate-800 hover:bg-white text-white hover:text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm">
                    Send Alert
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
         <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-slate-400" /> User Database</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search user..." 
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                   className="bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-500 w-48"
                 />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4 text-center">Strats</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map(user => {
                    const userStratCount = strategies.filter(s => s.userId === user.id).length;
                    return (
                      <tr key={user.id} className={`hover:bg-slate-800/50 transition-colors group cursor-pointer ${user.isBanned ? 'bg-red-900/10' : ''}`} onClick={() => handleInspectUser(user)}>
                        <td className="px-5 py-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700 group-hover:border-brand-500 transition-colors">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <div className="leading-tight flex items-center gap-2">
                               {user.username}
                               {user.isBanned && <Ban size={12} className="text-red-500" />}
                             </div>
                             <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-700/50 text-slate-400 border border-slate-700'}`}>
                             {user.role}
                           </span>
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-white">
                           {userStratCount}
                        </td>
                        <td className="px-5 py-4 text-right">
                           <ArrowRight size={16} className="ml-auto text-slate-600 group-hover:text-white" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
         </div>
      )}

      {activeTab === 'market' && (
         <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="p-5 border-b border-slate-800 bg-slate-950/50">
               <h3 className="font-bold text-white flex items-center gap-2"><Layout size={18} className="text-slate-400" /> Marketplace Content</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
               <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0 z-10">
                     <tr>
                        <th className="px-5 py-4">Strategy Name</th>
                        <th className="px-5 py-4">Author</th>
                        <th className="px-5 py-4 text-center">Price</th>
                        <th className="px-5 py-4 text-center">Installs</th>
                        <th className="px-5 py-4 text-right">Moderation</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                     {marketStrategies.map(m => (
                        <tr key={m.id} className="hover:bg-slate-800/50">
                           <td className="px-5 py-4 font-bold text-white">{m.name}</td>
                           <td className="px-5 py-4">{m.author}</td>
                           <td className="px-5 py-4 text-center font-mono text-emerald-400">${m.price}</td>
                           <td className="px-5 py-4 text-center">{m.copyCount}</td>
                           <td className="px-5 py-4 text-right">
                              <button onClick={() => handleDeleteMarketItem(m.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'logs' && (
         <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="p-5 border-b border-slate-800 bg-slate-950/50">
               <h3 className="font-bold text-white flex items-center gap-2"><List size={18} className="text-slate-400" /> Audit Logs</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
               <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0 z-10">
                     <tr>
                        <th className="px-5 py-4">Timestamp</th>
                        <th className="px-5 py-4">Action</th>
                        <th className="px-5 py-4">Details</th>
                        <th className="px-5 py-4">Admin ID</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                     {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/50 font-mono text-xs">
                           <td className="px-5 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                           <td className="px-5 py-4 font-bold text-brand-400">{log.action}</td>
                           <td className="px-5 py-4 text-white">{log.details}</td>
                           <td className="px-5 py-4 text-slate-600">{log.adminId}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'settings' && globalSettings && (
         <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 flex flex-col h-full max-h-[700px]">
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
               <h3 className="font-bold text-white flex items-center gap-2"><Settings size={18} className="text-slate-400" /> System Configuration</h3>
               <button 
                 onClick={handleSaveGlobalSettings}
                 className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
               >
                 <Save size={16} /> Save Changes
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               
               {/* General */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">General Settings</h4>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Site Name</label>
                        <input 
                          type="text" 
                          value={globalSettings.siteName} 
                          onChange={e => setGlobalSettings({...globalSettings, siteName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Maintenance Mode</label>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setGlobalSettings({...globalSettings, maintenanceMode: !globalSettings.maintenanceMode})}
                             className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${globalSettings.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${globalSettings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                           </button>
                           <span className="text-sm text-slate-400">{globalSettings.maintenanceMode ? 'Active (Site Offline)' : 'Inactive (Site Online)'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* API Keys */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">API Integrations</h4>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">API-Football Key</label>
                        <input 
                          type="password" 
                          value={globalSettings.apiFootballKey} 
                          onChange={e => setGlobalSettings({...globalSettings, apiFootballKey: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">SportMonks Token</label>
                        <input 
                          type="password" 
                          value={globalSettings.sportMonksToken} 
                          onChange={e => setGlobalSettings({...globalSettings, sportMonksToken: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">The Odds API Key</label>
                           <input 
                             type="password" 
                             value={globalSettings.oddsApiKey} 
                             onChange={e => setGlobalSettings({...globalSettings, oddsApiKey: e.target.value})}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Gemini AI Key</label>
                           <input 
                             type="password" 
                             value={globalSettings.geminiApiKey} 
                             onChange={e => setGlobalSettings({...globalSettings, geminiApiKey: e.target.value})}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Stripe */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Payment Gateway (Stripe)</h4>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Publishable Key</label>
                        <input 
                          type="text" 
                          value={globalSettings.stripePublishableKey} 
                          onChange={e => setGlobalSettings({...globalSettings, stripePublishableKey: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Secret Key</label>
                        <input 
                          type="password" 
                          value={globalSettings.stripeSecretKey} 
                          onChange={e => setGlobalSettings({...globalSettings, stripeSecretKey: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                  </div>
               </div>

               {/* Email */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Email Service (SMTP)</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">SMTP Host</label>
                        <input 
                          type="text" 
                          value={globalSettings.smtpHost} 
                          onChange={e => setGlobalSettings({...globalSettings, smtpHost: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">SMTP User</label>
                        <input 
                          type="text" 
                          value={globalSettings.smtpUser} 
                          onChange={e => setGlobalSettings({...globalSettings, smtpUser: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-brand-500 focus:outline-none" 
                        />
                     </div>
                  </div>
               </div>

            </div>
         </div>
      )}
    </div>
  );
};

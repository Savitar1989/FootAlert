
import React, { useEffect, useState } from 'react';
import { User, ApiSettings, AlertStrategy, SystemStats } from '../types';
import { db } from '../services/db';
import { Users, Activity, Bell, Server, Shield, Globe, Search, ArrowRight, ChevronLeft, Target } from 'lucide-react';
import { StrategyDetailsModal } from './StrategyDetailsModal';

interface AdminDashboardProps {
  settings: ApiSettings;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [strategies, setStrategies] = useState<AlertStrategy[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserStrategies, setSelectedUserStrategies] = useState<AlertStrategy[]>([]);
  const [viewingStrategy, setViewingStrategy] = useState<AlertStrategy | null>(null);

  const [filter, setFilter] = useState('');

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      const u = await db.users.getAll();
      const s = await db.strategies.getAll();
      const stats = await db.stats.getGlobal();
      setUsers(u);
      setStrategies(s);
      setSystemStats(stats);
    };
    loadData();
  }, []);

  // Inspect User
  const handleInspectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedUserStrategies(strategies.filter(s => s.userId === user.id));
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(filter.toLowerCase()));

  // If a user is selected, show Detail View
  if (selectedUser) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedUser(null)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-bold uppercase tracking-wider transition-colors"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white">{selectedUser.username}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                       <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">{selectedUser.id}</span>
                       <span>•</span>
                       <span>{selectedUser.email}</span>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">Joined</div>
                 <div className="text-white font-mono">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
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

  // --- DASHBOARD OVERVIEW ---

  const stats = [
    { label: 'Total Users', value: systemStats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Strategies', value: systemStats?.totalStrategies || 0, icon: Activity, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Global Alerts Sent', value: systemStats?.totalAlertsSent.toLocaleString() || 0, icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Server Load', value: `${systemStats?.serverLoad}%`, icon: Server, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-2 space-y-8 animate-in fade-in duration-500">
      
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-30 ${stat.bg.replace('/10','/40')}`}></div>
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                   <stat.icon size={22} className={stat.color} />
                 </div>
               </div>
               <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
               <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid md:grid-cols-3 gap-6">
         
         {/* User Table */}
         <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
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
            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4">User Identity</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4 text-center">Strats</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map(user => {
                    const userStratCount = strategies.filter(s => s.userId === user.id).length;
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => handleInspectUser(user)}>
                        <td className="px-5 py-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700 group-hover:border-brand-500 transition-colors">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <div className="leading-tight">{user.username}</div>
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
                           <button className="text-slate-500 hover:text-brand-400 transition-colors">
                              <ArrowRight size={16} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
         </div>

         {/* System Health / Traffic Visualization */}
         <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Globe size={18} className="text-brand-500"/> Traffic & Load</h3>
            
            {/* Fake Traffic Chart */}
            <div className="flex-1 flex items-end gap-2 h-40 mb-6 px-2">
               {systemStats?.traffic.map((val, i) => (
                  <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative group overflow-hidden" style={{height: `${(val / 600) * 100}%`}}>
                     <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500/50 group-hover:bg-brand-400"></div>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {val} hits
                     </div>
                  </div>
               ))}
            </div>
            
            <div className="space-y-4">
               <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Global ROI Performance</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-emerald-400">+{systemStats?.globalRoi}%</span>
                    <span className="text-xs text-emerald-500/50">All Users Avg</span>
                  </div>
               </div>

               <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">API Connection</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${settings.useDemoData ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></div>
                    <span className="text-white font-mono text-sm font-bold">{settings.useDemoData ? 'SIMULATION MODE' : 'LIVE FEED ACTIVE'}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

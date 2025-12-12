
import React, { useState } from 'react';
import { X, Key, Save, AlertTriangle, Shield, Bell, Zap, Database, DollarSign } from 'lucide-react';
import { ApiSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'providers'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-brand-400" /> App Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
           <button 
             onClick={() => setActiveTab('general')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'general' ? 'text-white bg-white/5 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             General
           </button>
           <button 
             onClick={() => setActiveTab('providers')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'providers' ? 'text-white bg-white/5 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Data Providers
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Bell size={12} /> Live Tracking
              </h3>
              
              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <label className="block text-sm font-medium text-slate-300 mb-3">Refresh Interval</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={localSettings.refreshRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, refreshRate: parseInt(e.target.value) })}
                    className="flex-1 accent-brand-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded border border-brand-500/20">
                    {localSettings.refreshRate}s
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Faster refresh rates provide better alerts but consume more data/API quota.
                </p>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Data Source Mode</label>
                  <div className="flex gap-2 bg-slate-900 p-1.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, useDemoData: true }))}
                      className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-md transition-all ${localSettings.useDemoData ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                      Simulation (Demo)
                    </button>
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, useDemoData: false }))}
                      className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-md transition-all ${!localSettings.useDemoData ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                      Live API
                    </button>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-6">
               <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex gap-3">
                  <Database size={20} className="text-indigo-400 mt-0.5" />
                  <div className="text-xs text-indigo-200">
                     Configure external APIs to save quotas. API-Football is default. SportMonks offers more depth. The Odds API saves football-api requests.
                  </div>
               </div>

               {/* Primary Provider Selector */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Primary Stats Provider</label>
                  <select 
                    value={localSettings.primaryProvider || 'api-football'}
                    onChange={(e) => setLocalSettings(s => ({ ...s, primaryProvider: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-brand-500 focus:outline-none"
                  >
                     <option value="api-football">API-Football (Standard)</option>
                     <option value="sportmonks">SportMonks v3 (Advanced)</option>
                  </select>
               </div>

               {/* API Keys */}
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex justify-between">
                      <span>API-Football Key</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">Required</span>
                    </label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="password"
                        value={localSettings.apiKey}
                        onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                        placeholder="Paste API-Football Key"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-brand-500 focus:outline-none font-mono text-xs shadow-inner"
                      />
                    </div>
                  </div>

                  {localSettings.primaryProvider === 'sportmonks' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-slate-300 flex justify-between">
                           <span>SportMonks API Token</span>
                           <span className="text-[10px] text-brand-400 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded">Active</span>
                        </label>
                        <div className="relative">
                           <Key size={14} className="absolute left-3 top-3 text-slate-500" />
                           <input
                              type="password"
                              value={localSettings.sportMonksApiKey || ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, sportMonksApiKey: e.target.value })}
                              placeholder="Paste SportMonks Token"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-brand-500 focus:outline-none font-mono text-xs shadow-inner"
                           />
                        </div>
                     </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-white/5">
                     <label className="block text-sm font-medium text-slate-300 flex justify-between">
                       <span>The Odds API Key</span>
                       <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">Free Quota Saver</span>
                     </label>
                     <p className="text-[10px] text-slate-500 mb-1">Use this to fetch live odds without consuming API-Football/SportMonks requests.</p>
                     <div className="relative">
                       <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
                       <input
                         type="password"
                         value={localSettings.oddsApiKey || ''}
                         onChange={(e) => setLocalSettings({ ...localSettings, oddsApiKey: e.target.value })}
                         placeholder="Paste The Odds API Key"
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-brand-500 focus:outline-none font-mono text-xs shadow-inner"
                       />
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/5 bg-white/5 flex justify-end">
          <button
            onClick={() => { onSave(localSettings); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-brand-500/20"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

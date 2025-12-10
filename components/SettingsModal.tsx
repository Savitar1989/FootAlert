
import React, { useState } from 'react';
import { X, Key, Save, AlertTriangle, Shield, Bell, Zap } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-brand-400" /> App Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* User Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Bell size={12} /> General Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Refresh Rate</label>
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
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                    {localSettings.refreshRate}s
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  How often the app checks for new match data.
                </p>
              </div>
            </div>
          </div>

          {/* Developer / Admin Section */}
          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={() => setShowDevOptions(!showDevOptions)}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors mb-4"
            >
              <Zap size={12} />
              {showDevOptions ? 'Hide Developer Options' : 'Show Developer Options'}
            </button>

            {showDevOptions && (
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-5 animate-in fade-in slide-in-from-top-2">
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Data Source Mode</label>
                  <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, useDemoData: true }))}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${localSettings.useDemoData ? 'bg-orange-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                    >
                      SIMULATION
                    </button>
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, useDemoData: false }))}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${!localSettings.useDemoData ? 'bg-brand-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                    >
                      LIVE API
                    </button>
                  </div>
                </div>

                {!localSettings.useDemoData && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex justify-between">
                      <span>API Key</span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Admin Only</span>
                    </label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="password"
                        value={localSettings.apiKey}
                        onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                        placeholder="Paste API-Football Key"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-brand-500 focus:outline-none font-mono text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      <AlertTriangle size={10} className="inline mr-1 text-orange-400" />
                      In a production app, this key should be hidden on a backend server.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
          <button
            onClick={() => { onSave(localSettings); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-900 font-bold text-sm rounded-lg transition-all shadow-lg shadow-brand-500/20"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

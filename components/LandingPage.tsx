
import React from 'react';
import { Logo } from './Logo';
import { ArrowRight, BarChart2, Shield, Zap, Target, Globe, CheckCircle } from 'lucide-react';
import { Footer } from './Footer';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Sign In</button>
            <button onClick={onLogin} className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-brand-500/20">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 text-brand-400 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Live v2.5 Engine Active
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 delay-100">
            Automate your <br/> Football Strategy.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 delay-200">
            Set conditions on live xG, pressure, and odds. Get instant alerts when your criteria are met. No more staring at stats for 90 minutes.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <button onClick={onLogin} className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105">
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
              View Marketplace
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-brand-500/30 transition-colors">
              <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Precision Triggers</h3>
              <p className="text-slate-400 leading-relaxed">
                Combine 50+ metrics like xG, Possession, and Dangerous Attacks to create the perfect alert.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Strategy Market</h3>
              <p className="text-slate-400 leading-relaxed">
                Don't have a strategy? Clone proven winners from our community marketplace instantly.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Alerts</h3>
              <p className="text-slate-400 leading-relaxed">
                Receive notifications via App, Email, or Telegram the second your criteria are hit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-24 text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-12">Trusted by 10,000+ Pro Bettors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div>
                  <div className="text-4xl font-black text-white mb-2">24/7</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Monitoring</div>
               </div>
               <div>
                  <div className="text-4xl font-black text-brand-400 mb-2">15k+</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alerts Daily</div>
               </div>
               <div>
                  <div className="text-4xl font-black text-white mb-2">98%</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Uptime</div>
               </div>
               <div>
                  <div className="text-4xl font-black text-indigo-400 mb-2">$0</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">To Start</div>
               </div>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
};

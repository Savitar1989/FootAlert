
import React from 'react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Logo size="lg" />
          <p className="text-slate-500 text-sm mt-4 max-w-xs">
            FootAlert provides real-time analytics and strategy automation for football enthusiasts. 
            Level up your game with data-driven insights.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-brand-400">Live Engine</a></li>
            <li><a href="#" className="hover:text-brand-400">Strategy Market</a></li>
            <li><a href="#" className="hover:text-brand-400">Pricing</a></li>
            <li><a href="#" className="hover:text-brand-400">API Status</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-brand-400">Terms of Service</a></li>
            <li><a href="#" className="hover:text-brand-400">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-brand-400">Responsible Gaming</a></li>
            <li><a href="#" className="hover:text-brand-400">Contact Support</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} FootAlert Pro. All rights reserved.</p>
        <p className="mt-2 md:mt-0">18+ Only. Please gamble responsibly.</p>
      </div>
    </footer>
  );
};

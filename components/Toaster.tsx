
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { X, CheckCircle, Info, AlertTriangle, Bell } from 'lucide-react';

interface ToasterProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle className="text-emerald-400" size={20} />,
    info: <Bell className="text-brand-400" size={20} />,
    warning: <AlertTriangle className="text-orange-400" size={20} />
  };

  const bgs = {
    success: 'bg-emerald-950/90 border-emerald-500/30',
    info: 'bg-slate-900/90 border-brand-500/30',
    warning: 'bg-orange-950/90 border-orange-500/30'
  };

  return (
    <div className={`pointer-events-auto w-80 p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-right-full duration-300 ${bgs[toast.type]}`}>
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white mb-0.5">{toast.title}</h4>
        <p className="text-xs text-slate-300 leading-snug">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-slate-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

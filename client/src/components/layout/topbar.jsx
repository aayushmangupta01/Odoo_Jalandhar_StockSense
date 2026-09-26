import React from 'react';
import { Search, Bell, User, Sparkles, Building2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Stock Search Shortcut */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => navigate('/inventory/stock-detective')}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-400 hover:border-cyan-500/50 hover:text-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Ask Stock Detective or search SKU, product...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Location Contract Indicator */}
      <div className="flex items-center gap-3">
        {/* Active Warehouse Integration Contract Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Warehouse: <span className="font-semibold text-slate-100">Main Warehouse (WH-01)</span></span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/inventory/intelligence/anomalies')}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Inventory Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-slate-950" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-cyan-400">
            IM
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">Inventory Lead</p>
            <p className="text-[10px] text-slate-400">Inventory Management</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

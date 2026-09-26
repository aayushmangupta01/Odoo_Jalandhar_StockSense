import React from 'react';
import { Search, Bell, Sparkles, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { useToast } from '../common/ToastContext';

export function Topbar() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = authApi.getCurrentUser();
  const displayName = user?.name || user?.email || 'StockSense user';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Staff';
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      showToast(error.response?.data?.error || 'Signed out locally, but the server could not revoke the session.', 'error');
    }
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Stock Search Shortcut */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/inventory/stock-detective' : '/inventory/products')}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 hover:border-blue-300 hover:text-slate-800 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Ask Stock Detective or search SKU, product...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Location Contract Indicator */}
      <div className="flex items-center gap-3">
        {/* Active Warehouse Integration Contract Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px]">Warehouse: <span className="font-semibold text-slate-900">{user?.role === 'admin' ? 'All warehouses' : user?.warehouseId || 'Unassigned'}</span></span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/inventory/intelligence/anomalies' : '/inventory/alerts')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Inventory Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700"
            aria-hidden="true"
          >
            {initials || 'U'}
          </div>
          <div className="hidden lg:block text-left max-w-40">
            <p className="truncate text-xs font-semibold text-slate-800 leading-tight" title={displayName}>
              {displayName}
            </p>
            <p className="truncate text-[10px] text-slate-500" title={user?.email || roleLabel}>
              {user?.email ? `${roleLabel} · ${user.email}` : roleLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  ClipboardCheck,
  PackagePlus,
  History,
  FileSpreadsheet,
  BarChart3,
  AlertTriangle,
  TrendingDown,
  MapPin,
  Sparkles,
  Bot,
  Warehouse,
  ChevronRight
} from 'lucide-react';

export function Sidebar() {
  const { pathname } = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});

  const navSection = (title, groups) => (
    <div className="mb-5">
      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </p>
      <div className="space-y-1">
        {groups.map((group) => {
          const isActiveGroup = group.items.some(({ path }) =>
            pathname === path || pathname.startsWith(`${path}/`)
          );
          const isExpanded = expandedGroups[group.id] ?? isActiveGroup;

          return (
            <div key={group.id}>
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedGroups((current) => ({
                  ...current,
                  [group.id]: !isExpanded
                }))}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
              >
                <span>{group.label}</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-800 pl-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const coreInventory = [
    {
      id: 'catalog',
      label: 'Product Catalog',
      items: [
        { path: '/inventory/products', label: 'Products', icon: Package },
        { path: '/inventory/categories', label: 'Categories', icon: FolderTree },
      ]
    },
    {
      id: 'stock',
      label: 'Stock Management',
      items: [
        { path: '/inventory/stock', label: 'Current Stock', icon: Boxes },
        { path: '/inventory/opening-stock', label: 'Opening Stock', icon: PackagePlus },
        { path: '/inventory/physical-verification', label: 'Physical Count', icon: ClipboardCheck },
      ]
    },
    {
      id: 'operations',
      label: 'Stock Operations',
      items: [
        { path: '/inventory/receipts', label: 'Receipts', icon: ArrowDownLeft },
        { path: '/inventory/deliveries', label: 'Delivery Orders', icon: ArrowUpRight },
        { path: '/inventory/adjustments', label: 'Adjustments', icon: Sliders },
      ]
    },
    {
      id: 'reports',
      label: 'History & Reports',
      items: [
        { path: '/inventory/movements', label: 'Stock Movements', icon: History },
        { path: '/inventory/ledger', label: 'Stock Ledger', icon: FileSpreadsheet },
        { path: '/inventory/analytics', label: 'Inventory Analytics', icon: BarChart3 },
      ]
    },
  ];

  const intelligence = [
    {
      id: 'monitoring',
      label: 'Monitoring',
      items: [
        { path: '/inventory/intelligence/anomalies', label: 'Anomalies', icon: AlertTriangle, badge: 'AI' },
      ]
    },
    {
      id: 'planning',
      label: 'Planning & Optimization',
      items: [
        { path: '/inventory/intelligence/forecast', label: 'Stock Forecast', icon: TrendingDown, badge: 'Predict' },
        { path: '/inventory/intelligence/recommendations', label: 'Smart Transfer', icon: Sparkles },
      ]
    },
    {
      id: 'warehouse-insights',
      label: 'Warehouse Insights',
      items: [
        { path: '/inventory/intelligence/location', label: 'Location Insights', icon: MapPin },
      ]
    },
    {
      id: 'assistant',
      label: 'Inventory Assistant',
      items: [
        { path: '/inventory/stock-detective', label: 'Stock Detective', icon: Bot, badge: 'NL Query' },
      ]
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-950/50">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-100 tracking-tight flex items-center gap-1">
              StockSense <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400">Intelligent Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* Main Dashboard Link (Owned by teammate) */}
        <div className="mb-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Main Dashboard</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">GLOBAL</span>
          </NavLink>
        </div>

        {navSection('Inventory Module', coreInventory)}
        {navSection('Inventory Intelligence', intelligence)}

        {/* Teammate Module Note */}
        <div className="mt-4 p-3 rounded-lg border border-slate-800/60 bg-slate-900/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-medium text-slate-300 mb-1">
            <Warehouse className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Warehouse Module</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Managed by Warehouse Teammate. Locations are consumed via integration contract.
          </p>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px]">INVENTORY ONLINE</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">SQLite DB</span>
      </div>
    </aside>
  );
}

export default Sidebar;

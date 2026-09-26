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
  ChevronRight,
  UserRoundCog,
  ScrollText,
  ClipboardList,
  BellRing,
  Truck,
} from 'lucide-react';
import { authApi } from '../../services/authApi';

export function Sidebar() {
  const { pathname } = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});
  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === 'admin';

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
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
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

  const staffWork = [
    {
      id: 'warehouse-work',
      label: 'My Warehouse Work',
      items: [
        { path: '/inventory/products', label: 'Products', icon: Package },
        { path: '/inventory/stock', label: 'Stock', icon: Boxes },
        { path: '/inventory/receipts', label: 'My Receipts', icon: ArrowDownLeft },
        { path: '/inventory/deliveries', label: 'My Deliveries', icon: ArrowUpRight },
        { path: '/inventory/transfers', label: 'My Transfers', icon: Truck },
      ],
    },
    {
      id: 'staff-follow-up',
      label: 'Alerts & Follow-up',
      items: [
        { path: '/inventory/alerts', label: 'Alerts', icon: BellRing },
        { path: '/inventory/adjustment-requests', label: 'Adjustment Requests', icon: ClipboardList },
        { path: '/inventory/my-activity', label: 'My Activity', icon: History },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center font-black text-white text-lg shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1">
              StockSense <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400">Intelligent Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* Role-specific dashboard */}
        <div className="mb-4">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">{isAdmin ? 'ADMIN' : 'STAFF'}</span>
          </NavLink>
        </div>

        {isAdmin ? (
          <>
            {navSection('Inventory Module', coreInventory)}
            {navSection('Stock Intelligence', intelligence)}
            {navSection('Administration', [
              {
                id: 'management',
                label: 'Management',
                items: [
                  { path: '/inventory/transfers', label: 'Internal Transfers', icon: Truck },
                  { path: '/inventory/adjustment-requests', label: 'Adjustment Approvals', icon: ClipboardList },
                  { path: '/inventory/audit-logs', label: 'Audit Logs', icon: ScrollText },
                  { path: '/admin/users', label: 'Users & Permissions', icon: UserRoundCog },
                ],
              },
            ])}
          </>
        ) : (
          navSection('Staff Workspace', staffWork)
        )}

        {/* Teammate Module Note */}
        {isAdmin && (
          <div className="mt-4 p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 font-medium text-slate-300 mb-1">
              <Warehouse className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Warehouse Module</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Warehouse structure is currently derived from inventory location records.
            </p>
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
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

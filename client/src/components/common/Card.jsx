import React from 'react';

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtext, icon: Icon, trend, color = 'cyan' }) {
  const colorStyles = {
    cyan: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
        <h4 className="text-2xl font-bold text-slate-100 mt-1 font-mono">{value}</h4>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium">
            <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
              {trend.isPositive ? '↑' : '↓'} {trend.label}
            </span>
            <span className="text-slate-500">vs last period</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg border ${colorStyles[color] || colorStyles.cyan}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export default Card;

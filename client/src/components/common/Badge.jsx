import React from 'react';

export function Badge({ children, status, variant = 'default', size = 'md', className = '' }) {
  const statusStyles = {
    // Inventory Stock Statuses
    IN_STOCK: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    LOW_STOCK: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    OUT_OF_STOCK: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    OVERSTOCKED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',

    // Workflow Statuses
    DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    WAITING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    READY: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    PICK: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    PACK: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

    // Intelligence Risk / Anomaly
    HIGH_RISK: 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse',
    UNUSUAL: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    NORMAL: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  };

  const activeStyle = status ? statusStyles[status] : statusStyles.DRAFT;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${activeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {children || status}
    </span>
  );
}

export default Badge;

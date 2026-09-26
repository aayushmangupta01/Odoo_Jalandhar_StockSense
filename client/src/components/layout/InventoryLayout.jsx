import React from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ToastProvider } from '../common/ToastContext';

export function InventoryLayout({ children }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default InventoryLayout;

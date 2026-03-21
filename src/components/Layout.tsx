import React from 'react';
import { Home, TrendingUp, Settings, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { LayoutProps } from './types';

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const tabs = [
    { id: 'home', label: 'Spending', icon: Home },
    { id: 'lifestyle', label: 'Lifestyle', icon: TrendingUp },
    { id: 'wallets', label: 'Wallets', icon: WalletIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full max-w-md mx-auto shadow-xl overflow-hidden relative">
      <main className="flex-1 overflow-y-auto p-4 pb-24 pt-6">
        {children}
      </main>

      <nav className="absolute bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-colors",
                  isActive ? "text-royal" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-royal/10")} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

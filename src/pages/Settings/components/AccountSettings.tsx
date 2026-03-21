import React from 'react';
import { Trash2, Globe } from 'lucide-react';
import { AccountSettingsProps } from '../types';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar ($)', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar ($)', symbol: 'A$' },
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real (R$)', symbol: 'R$' },
];

export function AccountSettings({ currency, onSetCurrency, onClear }: AccountSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-medium mb-2">Account Settings</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Customize your experience and manage your data.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div>
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-royal mr-2" />
            <h3 className="font-medium text-slate-800">Preferred Currency</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => onSetCurrency(c.code)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  currency === c.code
                    ? 'bg-royal/5 border-royal text-royal'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="font-mono font-bold">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center mb-4 text-rose-600">
            <Trash2 className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Danger Zone</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Permanently delete all your transactions, goals, wallets, and settings. This action cannot be undone.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Are you absolutely sure you want to erase ALL data? This cannot be undone.')) {
                onClear();
              }
            }}
            className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium hover:bg-rose-100 transition-colors"
          >
            Erase All Data
          </button>
        </div>
      </div>
    </div>
  );
}

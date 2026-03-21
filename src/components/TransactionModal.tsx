import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category, Wallet, TransactionType, RecurrenceType, RecurringTransaction } from '../types';
import { Modal } from './Modal';
import { Trash2, Wallet as WalletIcon, RefreshCw, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import { TransactionModalProps } from './types';

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  categories,
  wallets,
  currency,
  title
}: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletId, setWalletId] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType | 'none'>('none');
  const [status, setStatus] = useState<'posted' | 'scheduled'>('posted');
  const [isFixedCost, setIsFixedCost] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const formatWithCommas = (value: string) => {
    const [integer, decimal] = value.split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const isFutureDate = isAfter(parseISO(date), startOfDay(new Date()));

  useEffect(() => {
    if (!isFutureDate && status === 'scheduled') {
      setStatus('posted');
    }
  }, [date, isFutureDate, status]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAmount(initialData.amount?.toString() || '');
        setDisplayAmount(formatWithCommas(initialData.amount?.toString() || ''));
        setType(initialData.type || 'expense');
        setCategory(initialData.category || (initialData.type === 'income' ? incomeCategories[0]?.name : expenseCategories[0]?.name) || '');
        setDescription(initialData.description || '');
        setDate(initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setWalletId(initialData.walletId || wallets.find(w => w.isDefault)?.id || wallets[0]?.id || '');
        setRecurrence(initialData.recurrence || 'none');
        setStatus(initialData.status || 'posted');
        setIsFixedCost(initialData.isFixedCost || false);
      } else {
        setAmount('');
        setDisplayAmount('');
        setType('expense');
        setCategory(expenseCategories[0]?.name || '');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setWalletId(wallets.find(w => w.isDefault)?.id || wallets[0]?.id || '');
        setRecurrence('none');
        setStatus('posted');
        setIsFixedCost(false);
      }

      // Focus the amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData, categories, wallets]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const cats = newType === 'expense' ? expenseCategories : incomeCategories;
    if (!cats.find(c => c.name === category)) {
      setCategory(cats[0]?.name || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    onSave({
      amount: Number(amount),
      type,
      category,
      description: description,
      date: new Date(date).toISOString(),
      walletId: walletId || undefined,
      recurrence,
      status,
      isFixedCost
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-4 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors flex-shrink-0"
              title="Delete Transaction"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            form="transaction-form"
            className="flex-1 py-4 bg-royal text-white rounded-xl font-bold shadow-md shadow-royal/20 hover:bg-royal-dark transition-all active:scale-[0.98] text-sm"
          >
            Save
          </button>
        </div>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="flex justify-center py-2 overflow-x-auto">
          <div className="flex items-center justify-center w-full">
            <span className="text-slate-400 text-xl font-medium mr-1">{currency === 'USD' ? '$' : currency}</span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={displayAmount}
              onChange={(e) => {
                let rawValue = e.target.value.replace(/,/g, '');
                if (!/^\d*\.?\d*$/.test(rawValue)) return;
                const digitsOnly = rawValue.replace('.', '');
                if (digitsOnly.length > 12) return;
                setAmount(rawValue);
                setDisplayAmount(formatWithCommas(rawValue));
              }}
              className="bg-transparent text-4xl font-bold text-slate-800 focus:outline-none w-full text-center"
              required
            />
          </div>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'income' ? 'bg-white text-notion-green shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Income
          </button>
        </div>

        <hr className="border-slate-100" />

        <div className="flex flex-col">
          <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
            <WalletIcon className="w-5 h-5 text-slate-400" />
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm appearance-none"
              required
            >
              <option value="" disabled>Select a wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
            <Icons.Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm"
              required
            />
          </label>

          <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
            {(() => {
              const selectedCat = (type === 'expense' ? expenseCategories : incomeCategories).find(c => c.name === category);
              const IconComponent = selectedCat ? (Icons as any)[selectedCat.icon] || Icons.HelpCircle : Icons.Tag;
              return <IconComponent className="w-5 h-5 text-slate-400" />;
            })()}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm appearance-none"
              required
            >
              {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.lifestyleType && cat.lifestyleType !== 'none' ? `(${cat.lifestyleType.charAt(0).toUpperCase() + cat.lifestyleType.slice(1)}) ` : ''}{cat.name}
                </option>
              ))}
            </select>
          </label>

          {isFutureDate && (
            <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
              <Icons.Clock className="w-5 h-5 text-slate-400" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-slate-700 text-sm">Status</span>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'posted' ? 'scheduled' : 'posted')}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all border shadow-sm ${
                    status === 'posted' 
                      ? 'text-notion-green border-notion-green-light bg-white' 
                      : 'text-amber-600 border-amber-200 bg-white'
                  }`}
                >
                  {status === 'posted' ? 'Posted' : 'Scheduled'}
                </button>
              </div>
            </label>
          )}

          <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
            <Icons.AlignLeft className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400"
            />
          </label>

          <label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-400" />
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as any)}
              className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm appearance-none"
            >
              <option value="none">One-time</option>
              <option value="weekly">Every Week</option>
              <option value="monthly">Every Month</option>
            </select>
          </label>

          {recurrence !== 'none' && type === 'expense' && (
            <label className="flex items-center justify-between p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <Icons.Lock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700 text-sm">Fixed Cost</span>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="toggle"
                  id="toggle"
                  checked={isFixedCost}
                  onChange={(e) => setIsFixedCost(e.target.checked)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{
                    right: isFixedCost ? '0' : '1.25rem',
                    borderColor: isFixedCost ? '#4F46E5' : '#CBD5E1',
                    transition: 'all 0.2s ease'
                  }}
                />
                <label
                  htmlFor="toggle"
                  className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    backgroundColor: isFixedCost ? '#4F46E5' : '#CBD5E1',
                    transition: 'all 0.2s ease'
                  }}
                ></label>
              </div>
            </label>
          )}
        </div>
      </form>
    </Modal>
  );
}

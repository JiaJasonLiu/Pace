import React, { useState } from 'react';
import { RecurringTransaction, Category, Wallet, TransactionType, RecurrenceType } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { RefreshCw, ArrowUpCircle, ArrowDownCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format, parseISO, addWeeks, addMonths, isBefore, startOfDay, isSameDay } from 'date-fns';
import { TransactionModal } from '../../../components/TransactionModal';
import { RecurringSettingsProps } from '../types';

export function RecurringSettings({ recurringTransactions, categories, wallets, currency, onUpdate, onDelete }: RecurringSettingsProps) {
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleActive = (e: React.MouseEvent, r: RecurringTransaction) => {
    e.stopPropagation();
    onUpdate({ ...r, isActive: !r.isActive });
  };

  const handleEdit = (r: RecurringTransaction) => {
    setEditingRecurring(r);
    setIsModalOpen(true);
  };

  const handleSave = (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    walletId?: string;
    recurrence: RecurrenceType | 'none';
    status: 'posted' | 'scheduled';
    isFixedCost?: boolean;
  }) => {
    if (editingRecurring) {
      if (data.recurrence === 'none') {
        onDelete(editingRecurring.id);
      } else {
        onUpdate({
          ...editingRecurring,
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          walletId: data.walletId,
          recurrence: data.recurrence as RecurrenceType,
          isFixedCost: data.isFixedCost,
        });
      }
      setIsModalOpen(false);
    }
  };

  const getNextOccurrence = (startDate: string, recurrence: RecurrenceType) => {
    const start = parseISO(startDate);
    const now = startOfDay(new Date());
    let checkDate = start;
    
    while (isBefore(checkDate, now) || isSameDay(checkDate, now)) {
      checkDate = recurrence === 'weekly' ? addWeeks(checkDate, 1) : addMonths(checkDate, 1);
    }
    
    return checkDate;
  };

  const getRecurrenceLabel = (startDate: string, recurrence: RecurrenceType) => {
    const nextDate = getNextOccurrence(startDate, recurrence);
    return `NEXT: ${format(nextDate, 'MMM d').toUpperCase()} • ${recurrence.toUpperCase()}`;
  };

  const sortedRecurring = [...recurringTransactions].sort((a, b) => {
    const isASalary = a.description === 'Salary' && a.type === 'income';
    const isBSalary = b.description === 'Salary' && b.type === 'income';
    if (isASalary && !isBSalary) return -1;
    if (!isASalary && isBSalary) return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-royal" />
          Recurring Transactions
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          These transactions are automatically generated based on your settings.
        </p>

        <div className="space-y-4">
          {sortedRecurring.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-50" />
              <p className="text-slate-500 font-medium">No recurring transactions yet.</p>
              <p className="text-xs text-slate-400 mt-1">Create one from the Spending view.</p>
            </div>
          ) : (
            sortedRecurring.map(r => {
              const category = categories.find(c => c.name === r.category && c.type === r.type);
              const IconComponent = category?.icon ? (Icons as any)[category.icon] : (r.type === 'income' ? ArrowUpCircle : ArrowDownCircle);

              return (
                <div 
                  key={r.id}
                  onClick={() => {
                    if (r.description !== 'Salary') {
                      handleEdit(r);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${r.description !== 'Salary' ? 'cursor-pointer hover:border-royal/30' : ''} flex flex-col gap-3 ${r.isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-75'}`}
                >
                  {/* Top Row: Title and Amount */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.type === 'income' ? 'bg-notion-green-light text-notion-green' : 'bg-rose-50 text-rose-600'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{r.description || category?.name}</p>
                        {r.description === 'Salary' && (
                          <span className="bg-royal/10 text-royal text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Auto</span>
                        )}
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-lg ${r.type === 'income' ? 'text-notion-green' : 'text-slate-800'}`}>
                      {r.type === 'income' ? '+' : ''}{formatCurrency(r.amount, currency)}
                    </span>
                  </div>

                  {/* Bottom Row: Recurrence Description and Toggle */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {getRecurrenceLabel(r.startDate, r.recurrence)}
                    </span>
                    <button
                      onClick={(e) => toggleActive(e, r)}
                      className={`p-1 rounded-lg transition-colors ${r.isActive ? 'text-notion-green hover:bg-notion-green-light' : 'text-slate-300 hover:bg-slate-100'}`}
                      title={r.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {r.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={editingRecurring && editingRecurring.description !== 'Salary' ? () => {
          onDelete(editingRecurring.id);
          setIsModalOpen(false);
        } : undefined}
        initialData={editingRecurring ? {
          amount: editingRecurring.amount,
          type: editingRecurring.type,
          category: editingRecurring.category,
          description: editingRecurring.description,
          date: editingRecurring.startDate,
          walletId: editingRecurring.walletId,
          recurrence: editingRecurring.recurrence,
          isFixedCost: editingRecurring.isFixedCost
        } : undefined}
        categories={categories}
        wallets={wallets}
        currency={currency}
        title="Edit Recurring Transaction"
      />
    </div>
  );
}

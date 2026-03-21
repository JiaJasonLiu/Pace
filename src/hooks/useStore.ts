import { useState, useEffect } from 'react';
import { Transaction, LifestyleGoal, Category, Wallet, AppState, LifestyleSettings, MotivationalEarning, RecurringTransaction } from '../types';
import { addWeeks, addMonths, isBefore, isSameDay, startOfDay, parseISO, startOfWeek } from 'date-fns';
import { defaultCategories, STORAGE_KEY } from '../constants';

const defaultState: AppState = {
  transactions: [],
  recurringTransactions: [],
  lifestyleGoals: [],
  categories: defaultCategories,
  wallets: [],
  currency: 'USD',
  lifestyleSettings: {
    incomeSource: 'default_wallet',
    percentages: {
      need: 50,
      want: 30,
      savings: 20,
    },
  },
};

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure lifestyleSettings and percentages exist
        if (parsed.lifestyleSettings && !parsed.lifestyleSettings.percentages) {
          parsed.lifestyleSettings.percentages = defaultState.lifestyleSettings?.percentages;
        }
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Consolidate recurring transaction processing and salary sync
  useEffect(() => {
    setState(prev => {
      let hasChanges = false;
      let nextRecurring = [...prev.recurringTransactions];
      let nextWallets = [...prev.wallets];
      let nextTransactions = [...prev.transactions];

      // 1. Sync Salary
      const defaultWallet = nextWallets.find(w => w.isDefault && w.type === 'normal');
      const salaryTransactions = nextRecurring.filter(r => r.description === 'Salary' && r.type === 'income');

      if (!defaultWallet || !defaultWallet.monthlyIncome || defaultWallet.monthlyIncome <= 0) {
        if (salaryTransactions.length > 0) {
          nextRecurring = nextRecurring.filter(r => r.description !== 'Salary' || r.type !== 'income');
          hasChanges = true;
        }
      } else {
        const monthlyIncomeValue = defaultWallet.monthlyIncome;
        const fixedCosts = nextRecurring
          .filter(r => r.isActive && r.isFixedCost && r.type === 'expense' && r.walletId === defaultWallet.id)
          .reduce((acc, r) => {
            const monthlyAmount = r.recurrence === 'weekly' ? r.amount * 4.33 : r.amount;
            return acc + monthlyAmount;
          }, 0);
        
        const netMonthlyIncome = monthlyIncomeValue - fixedCosts;
        const netWeeklyBudget = Math.floor(netMonthlyIncome / 4.33);

        if (salaryTransactions.length > 0) {
          const keepSalary = salaryTransactions[0];
          
          // Remove duplicates if any exist
          if (salaryTransactions.length > 1) {
            nextRecurring = nextRecurring.filter(r => r.id === keepSalary.id || (r.description !== 'Salary' || r.type !== 'income'));
            hasChanges = true;
          }

          if (
            Math.abs(keepSalary.amount - netWeeklyBudget) > 0.001 || 
            keepSalary.recurrence !== 'weekly' ||
            keepSalary.walletId !== defaultWallet.id ||
            keepSalary.isFixedCost !== true
          ) {
            nextRecurring = nextRecurring.map(r => 
              r.id === keepSalary.id 
                ? { ...r, amount: netWeeklyBudget, recurrence: 'weekly', walletId: defaultWallet.id, isFixedCost: true } 
                : r
            );
            hasChanges = true;
          }
        } else {
          const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
          nextRecurring.push({
            id: crypto.randomUUID(),
            amount: netWeeklyBudget,
            category: 'Salary',
            type: 'income',
            description: 'Salary',
            recurrence: 'weekly',
            startDate: monday.toISOString().split('T')[0],
            walletId: defaultWallet.id,
            isActive: true,
            isFixedCost: true
          });
          hasChanges = true;
        }
      }

      // 2. Process Recurring
      const now = startOfDay(new Date());
      const finalRecurring: RecurringTransaction[] = [];
      const newTransactions: Transaction[] = [];

      nextRecurring.forEach(r => {
        if (!r.isActive) {
          finalRecurring.push(r);
          return;
        }

        let lastDate = r.lastGeneratedDate ? parseISO(r.lastGeneratedDate) : null;
        let nextDate = lastDate 
          ? (r.recurrence === 'weekly' ? addWeeks(lastDate, 1) : addMonths(lastDate, 1))
          : parseISO(r.startDate);

        let currentLastDate = lastDate;
        let localHasChanges = false;

        while (isBefore(nextDate, now) || isSameDay(nextDate, now)) {
          // Check if this date is skipped
          const isSkipped = r.skippedDates?.some(d => isSameDay(parseISO(d), nextDate));
          
          if (!isSkipped) {
            // CRITICAL: Check if transaction already exists for this recurringId and date to prevent duplicates
            const alreadyExists = nextTransactions.some(t => t.recurringId === r.id && isSameDay(parseISO(t.date), nextDate));
            
            if (!alreadyExists) {
              newTransactions.push({
                id: crypto.randomUUID(),
                date: nextDate.toISOString(),
                amount: r.amount,
                type: r.type,
                category: r.category,
                description: r.description,
                walletId: r.walletId,
                recurringId: r.id,
                status: 'posted'
              });
            }
          }
          currentLastDate = nextDate;
          nextDate = r.recurrence === 'weekly' ? addWeeks(nextDate, 1) : addMonths(nextDate, 1);
          localHasChanges = true;
        }

        if (localHasChanges) {
          finalRecurring.push({ ...r, lastGeneratedDate: currentLastDate?.toISOString() });
          hasChanges = true;
        } else {
          finalRecurring.push(r);
        }
      });

      if (newTransactions.length > 0) {
        nextTransactions = [...nextTransactions, ...newTransactions];
        newTransactions.forEach(t => {
          if (t.walletId) {
            nextWallets = nextWallets.map(w => {
              if (w.id === t.walletId) {
                const change = t.type === 'income' ? t.amount : -t.amount;
                return { ...w, balance: w.balance + change };
              }
              return w;
            });
          }
        });
        hasChanges = true;
      }

      if (hasChanges) {
        return {
          ...prev,
          transactions: nextTransactions,
          recurringTransactions: finalRecurring,
          wallets: nextWallets
        };
      }

      return prev;
    });
  }, [state.wallets, state.recurringTransactions]);

  const addTransaction = (transaction: Transaction) => {
    const transactionWithStatus = { ...transaction, status: transaction.status || 'posted' };
    setState((prev) => {
      const newState = {
        ...prev,
        transactions: [...prev.transactions, transactionWithStatus],
      };
      
      if (transactionWithStatus.walletId && transactionWithStatus.status !== 'scheduled') {
        newState.wallets = (prev.wallets || []).map(w => {
          if (w.id === transactionWithStatus.walletId) {
            const change = transactionWithStatus.type === 'income' ? transactionWithStatus.amount : -transactionWithStatus.amount;
            return { ...w, balance: w.balance + change };
          }
          return w;
        });
      }
      
      return newState;
    });
  };

  const updateTransaction = (updated: Transaction) => {
    setState((prev) => {
      const old = prev.transactions.find(t => t.id === updated.id);
      if (!old) return prev;

      const newState = {
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === updated.id ? updated : t)),
      };

      // Revert old transaction balance
      if (old.walletId && old.status !== 'scheduled') {
        newState.wallets = (newState.wallets || []).map(w => {
          if (w.id === old.walletId) {
            const change = old.type === 'income' ? -old.amount : old.amount;
            return { ...w, balance: w.balance + change };
          }
          return w;
        });
      }

      // Apply new transaction balance
      if (updated.walletId && updated.status !== 'scheduled') {
        newState.wallets = (newState.wallets || []).map(w => {
          if (w.id === updated.walletId) {
            const change = updated.type === 'income' ? updated.amount : -updated.amount;
            return { ...w, balance: w.balance + change };
          }
          return w;
        });
      }

      return newState;
    });
  };

  const deleteTransaction = (id: string) => {
    setState((prev) => {
      const old = prev.transactions.find(t => t.id === id);
      if (!old) return prev;

      const newState = {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      };

      if (old.walletId && old.status !== 'scheduled') {
        newState.wallets = (prev.wallets || []).map(w => {
          if (w.id === old.walletId) {
            const change = old.type === 'income' ? -old.amount : old.amount;
            return { ...w, balance: w.balance + change };
          }
          return w;
        });
      }

      return newState;
    });
  };

  const addGoal = (goal: LifestyleGoal) => {
    setState((prev) => ({
      ...prev,
      lifestyleGoals: [...prev.lifestyleGoals, goal],
    }));
  };

  const updateGoal = (updated: LifestyleGoal) => {
    setState((prev) => ({
      ...prev,
      lifestyleGoals: prev.lifestyleGoals.map((g) => (g.id === updated.id ? updated : g)),
    }));
  };

  const deleteGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      lifestyleGoals: prev.lifestyleGoals.filter((g) => g.id !== id),
    }));
  };

  const addCategory = (category: Category) => {
    setState((prev) => ({
      ...prev,
      categories: [...(prev.categories || defaultCategories), category],
    }));
  };

  const updateCategory = (updated: Category) => {
    setState((prev) => ({
      ...prev,
      categories: (prev.categories || defaultCategories).map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const deleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: (prev.categories || defaultCategories)
        .filter((c) => c.id !== id)
        .map(c => c.mainCategoryId === id ? { ...c, mainCategoryId: undefined } : c),
    }));
  };

  const addWallet = (wallet: Wallet) => {
    setState((prev) => {
      const wallets = prev.wallets || [];
      const updatedWallets = (wallet.isDefault && wallet.type === 'normal')
        ? wallets.map(w => ({ ...w, isDefault: false }))
        : wallets;
      
      return {
        ...prev,
        wallets: [...updatedWallets, { ...wallet, isDefault: (wallets.length === 0 && wallet.type === 'normal') ? true : (wallet.type === 'normal' ? wallet.isDefault : false) }],
      };
    });
  };

  const updateWallet = (updated: Wallet) => {
    setState((prev) => {
      const wallets = prev.wallets || [];
      let updatedWallets = wallets.map((w) => (w.id === updated.id ? updated : w));
      
      if (updated.isDefault && updated.type === 'normal') {
        updatedWallets = updatedWallets.map(w => 
          w.id === updated.id ? w : { ...w, isDefault: false }
        );
      } else if (updated.type === 'savings') {
        updatedWallets = updatedWallets.map(w =>
          w.id === updated.id ? { ...w, isDefault: false } : w
        );
      }
      
      return {
        ...prev,
        wallets: updatedWallets,
      };
    });
  };

  const deleteWallet = (id: string) => {
    setState((prev) => ({
      ...prev,
      wallets: (prev.wallets || []).filter((w) => w.id !== id),
    }));
  };

  const setCurrency = (currency: string) => {
    setState((prev) => ({
      ...prev,
      currency,
    }));
  };

  const updateLifestyleSettings = (settings: LifestyleSettings) => {
    setState((prev) => ({
      ...prev,
      lifestyleSettings: settings,
    }));
  };

  const updateMotivationalEarning = (motivationalEarning: MotivationalEarning) => {
    setState((prev) => ({
      ...prev,
      motivationalEarning,
    }));
  };

  const addRecurringTransaction = (recurring: RecurringTransaction) => {
    setState((prev) => ({
      ...prev,
      recurringTransactions: [...(prev.recurringTransactions || []), recurring],
    }));
    return recurring.id;
  };

  const updateRecurringTransaction = (updated: RecurringTransaction) => {
    setState((prev) => ({
      ...prev,
      recurringTransactions: (prev.recurringTransactions || []).map((r) => (r.id === updated.id ? updated : r)),
    }));
  };

  const deleteRecurringTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      recurringTransactions: (prev.recurringTransactions || []).filter((r) => r.id !== id),
    }));
  };

  const skipRecurringDate = (recurringId: string, date: string) => {
    setState((prev) => ({
      ...prev,
      recurringTransactions: (prev.recurringTransactions || []).map(r => {
        if (r.id === recurringId) {
          return {
            ...r,
            skippedDates: [...(r.skippedDates || []), date]
          };
        }
        return r;
      }),
    }));
  };

  const importData = (data: Partial<AppState>) => {
    setState((prev) => ({
      ...prev,
      transactions: data.transactions || prev.transactions,
      lifestyleGoals: data.lifestyleGoals || prev.lifestyleGoals,
      categories: data.categories || prev.categories || defaultCategories,
      wallets: data.wallets || prev.wallets || [],
      currency: data.currency || prev.currency || 'USD',
      lifestyleSettings: data.lifestyleSettings || prev.lifestyleSettings || defaultState.lifestyleSettings,
    }));
  };

  const clearData = () => {
    setState(defaultState);
  };

  return {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addCategory,
    updateCategory,
    deleteCategory,
    addWallet,
    updateWallet,
    deleteWallet,
    setCurrency,
    updateLifestyleSettings,
    updateMotivationalEarning,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    skipRecurringDate,
    importData,
    clearData,
  };
}

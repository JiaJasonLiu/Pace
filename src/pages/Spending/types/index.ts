import { Transaction, Category, Wallet, RecurringTransaction } from '../../../types';

export interface SpendingViewProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddRecurringTransaction: (r: RecurringTransaction) => string;
  onUpdateRecurringTransaction: (r: RecurringTransaction) => void;
  onDeleteRecurringTransaction: (id: string) => void;
  onSkipRecurringDate: (recurringId: string, date: string) => void;
  recurringTransactions: RecurringTransaction[];
}

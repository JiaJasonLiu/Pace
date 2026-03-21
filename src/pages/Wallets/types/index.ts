import { Transaction, Wallet, RecurringTransaction } from '../../../types';

export interface WalletsViewProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  wallets: Wallet[];
  currency: string;
  onAddWallet: (w: Wallet) => void;
  onUpdateWallet: (w: Wallet) => void;
  onDeleteWallet: (id: string) => void;
  onAddRecurringTransaction: (r: RecurringTransaction) => void;
  onUpdateRecurringTransaction: (r: RecurringTransaction) => void;
  onDeleteRecurringTransaction: (id: string) => void;
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWallet: (w: Wallet) => void;
  onUpdateWallet: (w: Wallet) => void;
  onDeleteWallet: (id: string) => void;
  onAddRecurringTransaction: (r: RecurringTransaction) => void;
  onUpdateRecurringTransaction: (r: RecurringTransaction) => void;
  onDeleteRecurringTransaction: (id: string) => void;
  editingWallet: Wallet | null;
  currency: string;
  isFirstWallet: boolean;
  recurringTransactions: RecurringTransaction[];
}

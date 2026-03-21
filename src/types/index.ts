export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  lifestyleType?: 'need' | 'want' | 'savings' | 'income' | 'none';
  mainCategoryId?: string;
}

export type TransactionStatus = 'posted' | 'scheduled';

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  walletId?: string;
  recurringId?: string;
  status?: TransactionStatus;
  isFixedCost?: boolean;
}

export interface LifestyleGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string; // ISO string
  description: string;
  category: 'need' | 'want' | 'savings';
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  monthlyIncome?: number;
  type: 'normal' | 'savings';
  isDefault?: boolean;
  savingsGoal?: number;
  savingsEndDate?: string;
}

export interface LifestyleSettings {
  incomeSource: 'default_wallet' | 'custom';
  customIncomeAmount?: number;
  percentages: {
    need: number;
    want: number;
    savings: number;
  };
}

export interface EarningAction {
  id: string;
  title: string;
  description: string;
  evidenceUrl?: string; // Link to evidence
  completed: boolean;
}

export interface MotivationalEarning {
  id: string;
  desiredLifestyle: string;
  requiredIncome: number;
  actions: EarningAction[];
}

export type RecurrenceType = 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  walletId?: string;
  recurrence: RecurrenceType;
  startDate: string; // ISO string, determines the weekday or day of month
  lastGeneratedDate?: string; // ISO string
  skippedDates?: string[]; // ISO strings
  isActive: boolean;
  isFixedCost?: boolean;
}

export interface AppState {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  lifestyleGoals: LifestyleGoal[];
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  lifestyleSettings?: LifestyleSettings;
  motivationalEarning?: MotivationalEarning;
}

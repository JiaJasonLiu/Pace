import React from 'react';
import { Transaction, Category, Wallet, TransactionType, RecurrenceType } from '../types';

export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  mainCategory?: Category;
  currency: string;
  onClick?: () => void;
  onAdd?: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  showLifestyleType?: boolean;
  rightElement?: React.ReactNode;
  customSubtitle?: React.ReactNode;
  isFixedCost?: boolean;
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    walletId?: string;
    recurrence: RecurrenceType | 'none';
    status: 'posted' | 'scheduled';
    isFixedCost?: boolean;
  }) => void;
  onDelete?: () => void;
  initialData?: Partial<Transaction & { recurrence?: RecurrenceType | 'none', isFixedCost?: boolean }>;
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  title: string;
}

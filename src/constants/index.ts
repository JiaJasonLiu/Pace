import { Category } from '../types';

export const STORAGE_KEY = 'royal_budget_data';

export const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', type: 'expense', icon: 'Utensils', lifestyleType: 'need' },
  { id: '1_1', name: 'Groceries', type: 'expense', icon: 'Utensils', lifestyleType: 'need', mainCategoryId: '1' },
  { id: '2', name: 'Transportation', type: 'expense', icon: 'Car', lifestyleType: 'need' },
  { id: '2_1', name: 'Fuel', type: 'expense', icon: 'Car', lifestyleType: 'need', mainCategoryId: '2' },
  { id: '3', name: 'Housing', type: 'expense', icon: 'Home', lifestyleType: 'need' },
  { id: '3_1', name: 'Rent', type: 'expense', icon: 'Home', lifestyleType: 'need', mainCategoryId: '3' },
  { id: '4', name: 'Entertainment', type: 'expense', icon: 'Film', lifestyleType: 'want' },
  { id: '4_1', name: 'Movies', type: 'expense', icon: 'Film', lifestyleType: 'want', mainCategoryId: '4' },
  { id: '5', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', lifestyleType: 'want' },
  { id: '5_1', name: 'Clothing', type: 'expense', icon: 'ShoppingBag', lifestyleType: 'want', mainCategoryId: '5' },
  { id: '6', name: 'Utilities', type: 'expense', icon: 'Zap', lifestyleType: 'need' },
  { id: '6_1', name: 'Electricity', type: 'expense', icon: 'Zap', lifestyleType: 'need', mainCategoryId: '6' },
  { id: '7', name: 'Health', type: 'expense', icon: 'HeartPulse', lifestyleType: 'need' },
  { id: '7_1', name: 'Insurance', type: 'expense', icon: 'HeartPulse', lifestyleType: 'need', mainCategoryId: '7' },
  { id: '8', name: 'Other', type: 'expense', icon: 'MoreHorizontal', lifestyleType: 'want' },
  { id: '8_1', name: 'Misc', type: 'expense', icon: 'MoreHorizontal', lifestyleType: 'want', mainCategoryId: '8' },
  { id: '9', name: 'Salary', type: 'income', icon: 'Briefcase', lifestyleType: 'income' },
  { id: '10', name: 'Freelance', type: 'income', icon: 'Laptop', lifestyleType: 'income' },
  { id: '11', name: 'Investments', type: 'income', icon: 'TrendingUp', lifestyleType: 'income' },
  { id: '12', name: 'Gifts', type: 'income', icon: 'Gift', lifestyleType: 'income' },
  { id: '13', name: 'Other', type: 'income', icon: 'MoreHorizontal', lifestyleType: 'none' },
  { id: '14', name: 'Savings Interest', type: 'income', icon: 'PiggyBank', lifestyleType: 'savings' },
  { id: '14_1', name: 'Bank Interest', type: 'income', icon: 'PiggyBank', lifestyleType: 'savings', mainCategoryId: '14' },
];

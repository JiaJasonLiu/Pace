import { defaultCategories } from "../constants";
import { DEFAULT_PERCENTAGES } from "../lib/finance";
import type { AppState } from "../types";

export const defaultAppState: AppState = {
	transactions: [],
	recurringTransactions: [],
	lifestyleGoals: [],
	categories: defaultCategories,
	wallets: [],
	currency: "GBP",
	lifestyleSettings: {
		incomeSource: "default_wallet",
		percentages: DEFAULT_PERCENTAGES,
	},
};

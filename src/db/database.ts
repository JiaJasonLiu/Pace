import Dexie, { type Table } from "dexie";
import type {
	Category,
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
	RecurringTransaction,
	Transaction,
	Wallet,
} from "../types";

export interface AppSettingsRow {
	id: number;
	currency: string;
	lifestyleSettings?: LifestyleSettings;
	motivationalEarning?: MotivationalEarning;
}

export class PaceBudgetDB extends Dexie {
	transactions!: Table<Transaction>;
	recurringTransactions!: Table<RecurringTransaction>;
	lifestyleGoals!: Table<LifestyleGoal>;
	categories!: Table<Category>;
	wallets!: Table<Wallet>;
	appSettings!: Table<AppSettingsRow>;

	constructor() {
		super("PaceBudget");
		this.version(1).stores({
			transactions: "id, date, walletId, type",
			recurringTransactions: "id",
			lifestyleGoals: "id",
			categories: "id",
			wallets: "id",
			appSettings: "id",
		});
	}
}

export const db = new PaceBudgetDB();

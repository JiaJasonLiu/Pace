import { defaultCategories } from "../../constants";
import { DEFAULT_PERCENTAGES } from "../../lib/finance";
import type { PaceDb } from "../client";
import type {
	AppState,
	Category,
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
	RecurringTransaction,
	Transaction,
	Wallet,
} from "../../types";

function rowToWallet(r: {
	id: string;
	name: string;
	balance: number;
	monthly_income: number | null;
	type: string;
	is_default: number;
	savings_goal: number | null;
	savings_end_date: string | null;
}): Wallet {
	return {
		id: r.id,
		name: r.name,
		balance: r.balance,
		monthlyIncome: r.monthly_income ?? undefined,
		type: r.type as Wallet["type"],
		isDefault: Boolean(r.is_default),
		savingsGoal: r.savings_goal ?? undefined,
		savingsEndDate: r.savings_end_date ?? undefined,
	};
}

function rowToTransaction(r: {
	id: string;
	date: string;
	amount: number;
	type: string;
	category: string;
	description: string;
	wallet_id: string | null;
	recurring_id: string | null;
	status: string;
	is_fixed_cost: number | null;
}): Transaction {
	return {
		id: r.id,
		date: r.date,
		amount: r.amount,
		type: r.type as Transaction["type"],
		category: r.category,
		description: r.description,
		walletId: r.wallet_id ?? undefined,
		recurringId: r.recurring_id ?? undefined,
		status: r.status as Transaction["status"],
		isFixedCost: r.is_fixed_cost == null ? undefined : Boolean(r.is_fixed_cost),
	};
}

function rowToRecurring(r: {
	id: string;
	amount: number;
	type: string;
	category: string;
	description: string;
	wallet_id: string | null;
	recurrence: string;
	start_date: string;
	last_generated_date: string | null;
	skipped_dates_json: string | null;
	is_active: number;
	is_fixed_cost: number | null;
}): RecurringTransaction {
	return {
		id: r.id,
		amount: r.amount,
		type: r.type as RecurringTransaction["type"],
		category: r.category,
		description: r.description,
		walletId: r.wallet_id ?? undefined,
		recurrence: r.recurrence as RecurringTransaction["recurrence"],
		startDate: r.start_date,
		lastGeneratedDate: r.last_generated_date ?? undefined,
		skippedDates: r.skipped_dates_json
			? (JSON.parse(r.skipped_dates_json) as string[])
			: undefined,
		isActive: Boolean(r.is_active),
		isFixedCost: r.is_fixed_cost == null ? undefined : Boolean(r.is_fixed_cost),
	};
}

function rowToCategory(r: {
	id: string;
	name: string;
	type: string;
	icon: string;
	lifestyle_type: string | null;
	main_category_id: string | null;
}): Category {
	return {
		id: r.id,
		name: r.name,
		type: r.type as Category["type"],
		icon: r.icon,
		lifestyleType: (r.lifestyle_type ?? undefined) as
			| Category["lifestyleType"]
			| undefined,
		mainCategoryId: r.main_category_id ?? undefined,
	};
}

function rowToGoal(r: {
	id: string;
	title: string;
	target_amount: number;
	current_amount: number | null;
	target_date: string | null;
	description: string;
	category: string;
}): LifestyleGoal {
	return {
		id: r.id,
		title: r.title,
		targetAmount: r.target_amount,
		currentAmount: r.current_amount ?? undefined,
		targetDate: r.target_date ?? undefined,
		description: r.description,
		category: r.category as LifestyleGoal["category"],
	};
}

export async function loadAppState(db: PaceDb): Promise<AppState> {
	const settings = await db
		.prepare("SELECT * FROM app_settings WHERE id = 1")
		.get();

	const walletsRows = await db.prepare("SELECT * FROM wallets").all();
	const transactionsRows = await db.prepare("SELECT * FROM transactions").all();
	const recurringRows = await db
		.prepare("SELECT * FROM recurring_transactions")
		.all();
	const categoriesRows = await db.prepare("SELECT * FROM categories").all();
	const goalsRows = await db.prepare("SELECT * FROM lifestyle_goals").all();

	const wallets = (walletsRows as Parameters<typeof rowToWallet>[0][]).map(
		rowToWallet,
	);
	const transactions = (
		transactionsRows as Parameters<typeof rowToTransaction>[0][]
	).map(rowToTransaction);
	const recurringTransactions = (
		recurringRows as Parameters<typeof rowToRecurring>[0][]
	).map(rowToRecurring);
	let categories = (categoriesRows as Parameters<typeof rowToCategory>[0][]).map(
		rowToCategory,
	);
	if (categories.length === 0) {
		categories = defaultCategories;
	}

	const goals = (goalsRows as Parameters<typeof rowToGoal>[0][]).map(rowToGoal);

	const s = settings as {
		currency: string;
		lifestyle_settings_json: string | null;
		motivational_earning_json: string | null;
	} | null;

	let lifestyleSettings: LifestyleSettings | undefined;
	if (s?.lifestyle_settings_json) {
		try {
			lifestyleSettings = JSON.parse(
				s.lifestyle_settings_json,
			) as LifestyleSettings;
			if (!lifestyleSettings.percentages) {
				lifestyleSettings.percentages = DEFAULT_PERCENTAGES;
			}
		} catch {
			lifestyleSettings = {
				incomeSource: "default_wallet",
				percentages: DEFAULT_PERCENTAGES,
			};
		}
	} else {
		lifestyleSettings = {
			incomeSource: "default_wallet",
			percentages: DEFAULT_PERCENTAGES,
		};
	}

	let motivationalEarning: MotivationalEarning | undefined;
	if (s?.motivational_earning_json) {
		try {
			motivationalEarning = JSON.parse(
				s.motivational_earning_json,
			) as MotivationalEarning;
		} catch {
			motivationalEarning = undefined;
		}
	}

	return {
		transactions,
		recurringTransactions,
		lifestyleGoals: goals,
		categories,
		wallets,
		currency: s?.currency ?? "USD",
		lifestyleSettings,
		motivationalEarning,
	};
}

export async function replaceTransactionsRecurringWallets(
	db: PaceDb,
	state: Pick<AppState, "transactions" | "recurringTransactions" | "wallets">,
): Promise<void> {
	await db.exec("BEGIN");
	try {
		await db.exec("DELETE FROM transactions");
		await db.exec("DELETE FROM recurring_transactions");
		await db.exec("DELETE FROM wallets");

		const insW = db.prepare(
			`INSERT INTO wallets (id, name, balance, monthly_income, type, is_default, savings_goal, savings_end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const w of state.wallets) {
			await insW.run(
				w.id,
				w.name,
				w.balance,
				w.monthlyIncome ?? null,
				w.type,
				w.isDefault ? 1 : 0,
				w.savingsGoal ?? null,
				w.savingsEndDate ?? null,
			);
		}

		const insT = db.prepare(
			`INSERT INTO transactions (id, date, amount, type, category, description, wallet_id, recurring_id, status, is_fixed_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const t of state.transactions) {
			await insT.run(
				t.id,
				t.date,
				t.amount,
				t.type,
				t.category,
				t.description,
				t.walletId ?? null,
				t.recurringId ?? null,
				t.status ?? "posted",
				t.isFixedCost == null ? null : t.isFixedCost ? 1 : 0,
			);
		}

		const insR = db.prepare(
			`INSERT INTO recurring_transactions (id, amount, type, category, description, wallet_id, recurrence, start_date, last_generated_date, skipped_dates_json, is_active, is_fixed_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const r of state.recurringTransactions) {
			await insR.run(
				r.id,
				r.amount,
				r.type,
				r.category,
				r.description,
				r.walletId ?? null,
				r.recurrence,
				r.startDate,
				r.lastGeneratedDate ?? null,
				r.skippedDates?.length
					? JSON.stringify(r.skippedDates)
					: null,
				r.isActive ? 1 : 0,
				r.isFixedCost == null ? null : r.isFixedCost ? 1 : 0,
			);
		}

		await db.exec("COMMIT");
	} catch (e) {
		await db.exec("ROLLBACK");
		throw e;
	}
}

export async function persistFullAppState(db: PaceDb, state: AppState): Promise<void> {
	await db.exec("BEGIN");
	try {
		await db.exec("DELETE FROM transactions");
		await db.exec("DELETE FROM recurring_transactions");
		await db.exec("DELETE FROM wallets");
		await db.exec("DELETE FROM categories");
		await db.exec("DELETE FROM lifestyle_goals");

		await db
			.prepare(
				`UPDATE app_settings SET currency = ?, lifestyle_settings_json = ?, motivational_earning_json = ? WHERE id = 1`,
			)
			.run(
				state.currency,
				state.lifestyleSettings
					? JSON.stringify(state.lifestyleSettings)
					: null,
				state.motivationalEarning
					? JSON.stringify(state.motivationalEarning)
					: null,
			);

		const insW = db.prepare(
			`INSERT INTO wallets (id, name, balance, monthly_income, type, is_default, savings_goal, savings_end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const w of state.wallets) {
			await insW.run(
				w.id,
				w.name,
				w.balance,
				w.monthlyIncome ?? null,
				w.type,
				w.isDefault ? 1 : 0,
				w.savingsGoal ?? null,
				w.savingsEndDate ?? null,
			);
		}

		const insT = db.prepare(
			`INSERT INTO transactions (id, date, amount, type, category, description, wallet_id, recurring_id, status, is_fixed_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const t of state.transactions) {
			await insT.run(
				t.id,
				t.date,
				t.amount,
				t.type,
				t.category,
				t.description,
				t.walletId ?? null,
				t.recurringId ?? null,
				t.status ?? "posted",
				t.isFixedCost == null ? null : t.isFixedCost ? 1 : 0,
			);
		}

		const insR = db.prepare(
			`INSERT INTO recurring_transactions (id, amount, type, category, description, wallet_id, recurrence, start_date, last_generated_date, skipped_dates_json, is_active, is_fixed_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const r of state.recurringTransactions) {
			await insR.run(
				r.id,
				r.amount,
				r.type,
				r.category,
				r.description,
				r.walletId ?? null,
				r.recurrence,
				r.startDate,
				r.lastGeneratedDate ?? null,
				r.skippedDates?.length
					? JSON.stringify(r.skippedDates)
					: null,
				r.isActive ? 1 : 0,
				r.isFixedCost == null ? null : r.isFixedCost ? 1 : 0,
			);
		}

		const insC = db.prepare(
			`INSERT INTO categories (id, name, type, icon, lifestyle_type, main_category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
		);
		for (const c of state.categories) {
			await insC.run(
				c.id,
				c.name,
				c.type,
				c.icon,
				c.lifestyleType ?? null,
				c.mainCategoryId ?? null,
			);
		}

		const insG = db.prepare(
			`INSERT INTO lifestyle_goals (id, title, target_amount, current_amount, target_date, description, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
		);
		for (const g of state.lifestyleGoals) {
			await insG.run(
				g.id,
				g.title,
				g.targetAmount,
				g.currentAmount ?? null,
				g.targetDate ?? null,
				g.description,
				g.category,
			);
		}

		await db.exec("COMMIT");
	} catch (e) {
		await db.exec("ROLLBACK");
		throw e;
	}
}

export async function hasAnyUserData(db: PaceDb): Promise<boolean> {
	const w = await db.prepare("SELECT COUNT(*) as c FROM wallets").get();
	const t = await db.prepare("SELECT COUNT(*) as c FROM transactions").get();
	const c = await db.prepare("SELECT COUNT(*) as c FROM categories").get();
	const wc = (w as { c: number }).c;
	const tc = (t as { c: number }).c;
	const cc = (c as { c: number }).c;
	return wc > 0 || tc > 0 || cc > 0;
}

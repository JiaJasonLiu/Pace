import { defaultCategories } from "../../constants";
import { DEFAULT_PERCENTAGES } from "../../lib/finance";
import type { AppState, Category } from "../../types";
import type { PaceDb } from "../client";
import { persistFullAppState } from "./shared";

export async function insertCategory(db: PaceDb, category: Category): Promise<void> {
	await db
		.prepare(
			`INSERT INTO categories (id, name, type, icon, lifestyle_type, main_category_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.run(
			category.id,
			category.name,
			category.type,
			category.icon,
			category.lifestyleType ?? null,
			category.mainCategoryId ?? null,
		);
}

export async function updateCategory(db: PaceDb, c: Category): Promise<void> {
	await db
		.prepare(
			`UPDATE categories SET name = ?, type = ?, icon = ?, lifestyle_type = ?, main_category_id = ?
     WHERE id = ?`,
		)
		.run(
			c.name,
			c.type,
			c.icon,
			c.lifestyleType ?? null,
			c.mainCategoryId ?? null,
			c.id,
		);
}

export async function deleteCategory(db: PaceDb, id: string): Promise<void> {
	await db.prepare("DELETE FROM categories WHERE id = ?").run(id);
	await db
		.prepare(
			"UPDATE categories SET main_category_id = NULL WHERE main_category_id = ?",
		)
		.run(id);
}

export async function setCurrency(db: PaceDb, currency: string): Promise<void> {
	await db.prepare("UPDATE app_settings SET currency = ? WHERE id = 1").run(currency);
}

const emptyAppState: AppState = {
	transactions: [],
	recurringTransactions: [],
	lifestyleGoals: [],
	categories: defaultCategories,
	wallets: [],
	currency: "USD",
	lifestyleSettings: {
		incomeSource: "default_wallet",
		percentages: DEFAULT_PERCENTAGES,
	},
};

export async function clearAllUserData(db: PaceDb): Promise<void> {
	await persistFullAppState(db, emptyAppState);
}

export async function mergeImportData(
	db: PaceDb,
	current: AppState,
	partial: Partial<AppState>,
): Promise<void> {
	const next: AppState = {
		...current,
		transactions: partial.transactions ?? current.transactions,
		lifestyleGoals: partial.lifestyleGoals ?? current.lifestyleGoals,
		categories:
			partial.categories?.length ? partial.categories : current.categories,
		wallets: partial.wallets?.length ? partial.wallets : current.wallets,
		currency: partial.currency ?? current.currency,
		lifestyleSettings:
			partial.lifestyleSettings ??
			current.lifestyleSettings ??
			emptyAppState.lifestyleSettings,
		recurringTransactions:
			partial.recurringTransactions ?? current.recurringTransactions,
		motivationalEarning: partial.motivationalEarning ?? current.motivationalEarning,
	};
	await persistFullAppState(db, next);
}

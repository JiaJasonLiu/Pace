import { defaultCategories, STORAGE_KEY } from "../constants";
import { DEFAULT_PERCENTAGES } from "../lib/finance";
import type { AppState } from "../types";
import type { PaceDb } from "./client";
import { hasAnyUserData, persistFullAppState } from "./queries/shared";

const defaultState: AppState = {
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

export async function migrateFromLocalStorageIfNeeded(db: PaceDb): Promise<void> {
	if (await hasAnyUserData(db)) {
		return;
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		await seedDefaultCategoriesIfEmpty(db);
		return;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<AppState>;
		if (parsed.lifestyleSettings && !parsed.lifestyleSettings.percentages) {
			parsed.lifestyleSettings.percentages =
				defaultState.lifestyleSettings?.percentages;
		}
		const merged: AppState = { ...defaultState, ...parsed };
		merged.categories =
			parsed.categories?.length ? parsed.categories : defaultCategories;
		await persistFullAppState(db, merged);
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.error("Failed to migrate localStorage into SQLite", e);
		await seedDefaultCategoriesIfEmpty(db);
	}
}

async function seedDefaultCategoriesIfEmpty(db: PaceDb): Promise<void> {
	const row = await db.prepare("SELECT COUNT(*) as c FROM categories").get();
	if ((row as { c: number }).c > 0) return;

	await db.exec("BEGIN");
	try {
		const ins = db.prepare(
			`INSERT INTO categories (id, name, type, icon, lifestyle_type, main_category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
		);
		for (const c of defaultCategories) {
			await ins.run(
				c.id,
				c.name,
				c.type,
				c.icon,
				c.lifestyleType ?? null,
				c.mainCategoryId ?? null,
			);
		}
		await db.exec("COMMIT");
	} catch (e) {
		await db.exec("ROLLBACK");
		throw e;
	}
}

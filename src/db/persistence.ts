import { defaultAppState } from "../state/defaultAppState";
import type { AppState } from "../types";
import { db, type AppSettingsRow } from "./database";

const SETTINGS_ID = 1;

export function mergeAppStatePartial(data: Partial<AppState>): AppState {
	const merged: AppState = { ...defaultAppState, ...data };
	if (
		merged.lifestyleSettings &&
		!merged.lifestyleSettings.percentages &&
		defaultAppState.lifestyleSettings?.percentages
	) {
		merged.lifestyleSettings = {
			...merged.lifestyleSettings,
			percentages: defaultAppState.lifestyleSettings.percentages,
		};
	}
	return merged;
}

export async function loadAppState(): Promise<AppState> {
	const [
		txCount,
		recCount,
		goalCount,
		catCount,
		walletCount,
		settings,
	] = await Promise.all([
		db.transactions.count(),
		db.recurringTransactions.count(),
		db.lifestyleGoals.count(),
		db.categories.count(),
		db.wallets.count(),
		db.appSettings.get(SETTINGS_ID),
	]);

	const isEmpty =
		txCount === 0 &&
		recCount === 0 &&
		goalCount === 0 &&
		catCount === 0 &&
		walletCount === 0 &&
		!settings;

	if (isEmpty) {
		return defaultAppState;
	}

	const [transactions, recurring, goals, categories, wallets] =
		await Promise.all([
			db.transactions.toArray(),
			db.recurringTransactions.toArray(),
			db.lifestyleGoals.toArray(),
			db.categories.toArray(),
			db.wallets.toArray(),
		]);

	return mergeAppStatePartial({
		transactions,
		recurringTransactions: recurring,
		lifestyleGoals: goals,
		categories,
		wallets,
		currency: settings?.currency,
		lifestyleSettings: settings?.lifestyleSettings,
		motivationalEarning: settings?.motivationalEarning,
	});
}

export async function persistAppState(state: AppState): Promise<void> {
	const settings: AppSettingsRow = {
		id: SETTINGS_ID,
		currency: state.currency,
		lifestyleSettings: state.lifestyleSettings,
		motivationalEarning: state.motivationalEarning,
	};

	await db.transaction(
		"rw",
		[
			db.transactions,
			db.recurringTransactions,
			db.lifestyleGoals,
			db.categories,
			db.wallets,
			db.appSettings,
		],
		async () => {
			await db.transactions.clear();
			await db.transactions.bulkPut(state.transactions);
			await db.recurringTransactions.clear();
			await db.recurringTransactions.bulkPut(state.recurringTransactions);
			await db.lifestyleGoals.clear();
			await db.lifestyleGoals.bulkPut(state.lifestyleGoals);
			await db.categories.clear();
			await db.categories.bulkPut(state.categories);
			await db.wallets.clear();
			await db.wallets.bulkPut(state.wallets);
			await db.appSettings.put(settings);
		},
	);
}

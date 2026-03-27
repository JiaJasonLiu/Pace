import { useCallback, useMemo } from "react";
import type { PaceAppReady } from "../../../db/AppStateProvider";
import { insertTransaction } from "../../../db/queries/spending";
import {
	deleteGoal,
	insertGoal,
	updateGoal,
	updateLifestyleSettingsJson,
	updateMotivationalEarningJson,
} from "../../../db/queries/lifestyle";
import type {
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
	Transaction,
} from "../../../types";
import type { LifestyleViewProps } from "../types";

export function useLifestyleController(app: PaceAppReady): LifestyleViewProps {
	const { db, state, refresh } = app;

	const onAddGoal = useCallback(
		(g: LifestyleGoal) => {
			void (async () => {
				await insertGoal(db, g);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateGoal = useCallback(
		(g: LifestyleGoal) => {
			void (async () => {
				await updateGoal(db, g);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onDeleteGoal = useCallback(
		(id: string) => {
			void (async () => {
				await deleteGoal(db, id);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateLifestyleSettings = useCallback(
		(s: LifestyleSettings) => {
			void (async () => {
				await updateLifestyleSettingsJson(db, s);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateMotivationalEarning = useCallback(
		(m: MotivationalEarning) => {
			void (async () => {
				await updateMotivationalEarningJson(db, m);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onAddTransaction = useCallback(
		(t: Transaction) => {
			void (async () => {
				await insertTransaction(db, t);
				await refresh();
			})();
		},
		[db, refresh],
	);

	return useMemo(
		() => ({
			goals: state.lifestyleGoals,
			wallets: state.wallets,
			transactions: state.transactions,
			categories: state.categories,
			currency: state.currency,
			lifestyleSettings: state.lifestyleSettings,
			motivationalEarning: state.motivationalEarning,
			onAddGoal,
			onUpdateGoal,
			onDeleteGoal,
			onUpdateLifestyleSettings,
			onUpdateMotivationalEarning,
			onAddTransaction,
		}),
		[
			state.lifestyleGoals,
			state.wallets,
			state.transactions,
			state.categories,
			state.currency,
			state.lifestyleSettings,
			state.motivationalEarning,
			onAddGoal,
			onUpdateGoal,
			onDeleteGoal,
			onUpdateLifestyleSettings,
			onUpdateMotivationalEarning,
			onAddTransaction,
		],
	);
}

import { useCallback, useMemo } from "react";
import type { PaceAppReady } from "../../../db/AppStateProvider";
import { deleteRecurring, updateRecurring } from "../../../db/queries/spending";
import {
	clearAllUserData,
	deleteCategory,
	insertCategory,
	mergeImportData,
	setCurrency,
	updateCategory,
} from "../../../db/queries/settings";
import type { AppState, Category, RecurringTransaction } from "../../../types";
import type { SettingsViewProps } from "../types";

export function useSettingsController(app: PaceAppReady): SettingsViewProps {
	const { db, state, refresh } = app;

	const onAddCategory = useCallback(
		(c: Category) => {
			void (async () => {
				await insertCategory(db, c);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateCategory = useCallback(
		(c: Category) => {
			void (async () => {
				await updateCategory(db, c);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onDeleteCategory = useCallback(
		(id: string) => {
			void (async () => {
				await deleteCategory(db, id);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onSetCurrency = useCallback(
		(currency: string) => {
			void (async () => {
				await setCurrency(db, currency);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateRecurringTransaction = useCallback(
		(r: RecurringTransaction) => {
			void (async () => {
				await updateRecurring(db, r);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onDeleteRecurringTransaction = useCallback(
		(id: string) => {
			void (async () => {
				await deleteRecurring(db, id);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onImport = useCallback(
		(data: Partial<AppState>) => {
			void (async () => {
				await mergeImportData(db, state, data);
				await refresh();
			})();
		},
		[db, state, refresh],
	);

	const onClear = useCallback(() => {
		void (async () => {
			await clearAllUserData(db);
			await refresh();
		})();
	}, [db, refresh]);

	return useMemo(
		() => ({
			state,
			onAddCategory,
			onUpdateCategory,
			onDeleteCategory,
			onSetCurrency,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
			onImport,
			onClear,
		}),
		[
			state,
			onAddCategory,
			onUpdateCategory,
			onDeleteCategory,
			onSetCurrency,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
			onImport,
			onClear,
		],
	);
}

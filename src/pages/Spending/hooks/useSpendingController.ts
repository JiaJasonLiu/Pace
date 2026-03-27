import { useCallback, useMemo } from "react";
import type { PaceAppReady } from "../../../db/AppStateProvider";
import {
	deleteRecurring,
	deleteTransaction,
	insertRecurring,
	insertTransaction,
	skipRecurringDate,
	updateRecurring,
	updateTransaction,
} from "../../../db/queries/spending";
import type { RecurringTransaction, Transaction } from "../../../types";
import type { SpendingViewProps } from "../types";

export function useSpendingController(app: PaceAppReady): SpendingViewProps {
	const { db, state, refresh } = app;

	const onAddTransaction = useCallback(
		(t: Transaction) => {
			void (async () => {
				await insertTransaction(db, t);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateTransaction = useCallback(
		(t: Transaction) => {
			void (async () => {
				await updateTransaction(db, t);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onDeleteTransaction = useCallback(
		(id: string) => {
			void (async () => {
				await deleteTransaction(db, id);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onAddRecurringTransaction = useCallback(
		(r: RecurringTransaction) => {
			void (async () => {
				await insertRecurring(db, r);
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

	const onSkipRecurringDate = useCallback(
		(recurringId: string, date: string) => {
			void (async () => {
				await skipRecurringDate(db, recurringId, date);
				await refresh();
			})();
		},
		[db, refresh],
	);

	return useMemo(
		() => ({
			transactions: state.transactions,
			recurringTransactions: state.recurringTransactions,
			categories: state.categories,
			wallets: state.wallets,
			currency: state.currency,
			onAddTransaction,
			onUpdateTransaction,
			onDeleteTransaction,
			onAddRecurringTransaction,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
			onSkipRecurringDate,
		}),
		[
			state.transactions,
			state.recurringTransactions,
			state.categories,
			state.wallets,
			state.currency,
			onAddTransaction,
			onUpdateTransaction,
			onDeleteTransaction,
			onAddRecurringTransaction,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
			onSkipRecurringDate,
		],
	);
}

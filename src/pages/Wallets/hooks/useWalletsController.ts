import { useCallback, useMemo } from "react";
import type { PaceAppReady } from "../../../db/AppStateProvider";
import {
	deleteRecurring,
	insertRecurring,
	updateRecurring,
} from "../../../db/queries/spending";
import {
	deleteWallet,
	insertWallet,
	updateWallet,
} from "../../../db/queries/wallets";
import type { RecurringTransaction, Wallet } from "../../../types";
import type { WalletsViewProps } from "../types";

export function useWalletsController(app: PaceAppReady): WalletsViewProps {
	const { db, state, refresh } = app;

	const onAddWallet = useCallback(
		(w: Wallet) => {
			void (async () => {
				await insertWallet(db, w);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onUpdateWallet = useCallback(
		(w: Wallet) => {
			void (async () => {
				await updateWallet(db, w);
				await refresh();
			})();
		},
		[db, refresh],
	);

	const onDeleteWallet = useCallback(
		(id: string) => {
			void (async () => {
				await deleteWallet(db, id);
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

	return useMemo(
		() => ({
			transactions: state.transactions,
			recurringTransactions: state.recurringTransactions,
			wallets: state.wallets,
			currency: state.currency,
			onAddWallet,
			onUpdateWallet,
			onDeleteWallet,
			onAddRecurringTransaction,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
		}),
		[
			state.transactions,
			state.recurringTransactions,
			state.wallets,
			state.currency,
			onAddWallet,
			onUpdateWallet,
			onDeleteWallet,
			onAddRecurringTransaction,
			onUpdateRecurringTransaction,
			onDeleteRecurringTransaction,
		],
	);
}

import { isSameDay, parseISO } from "date-fns";
import type { RecurringTransaction, Transaction } from "../../types";
import type { SetAppState } from "./types";

export function createSpendingActions(setState: SetAppState) {
	const addTransaction = (transaction: Transaction) => {
		const transactionWithStatus = {
			...transaction,
			status: transaction.status || "posted",
		};
		setState((prev) => {
			const newState = {
				...prev,
				transactions: [...prev.transactions, transactionWithStatus],
			};

			if (
				transactionWithStatus.walletId &&
				transactionWithStatus.status !== "scheduled"
			) {
				newState.wallets = (prev.wallets || []).map((w) => {
					if (w.id === transactionWithStatus.walletId) {
						const change =
							transactionWithStatus.type === "income"
								? transactionWithStatus.amount
								: -transactionWithStatus.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}

			return newState;
		});
	};

	const updateTransaction = (updated: Transaction) => {
		setState((prev) => {
			const old = prev.transactions.find((t) => t.id === updated.id);
			if (!old) return prev;

			const newState = {
				...prev,
				transactions: prev.transactions.map((t) =>
					t.id === updated.id ? updated : t,
				),
			};

			if (old.walletId && old.status !== "scheduled") {
				newState.wallets = (newState.wallets || []).map((w) => {
					if (w.id === old.walletId) {
						const change = old.type === "income" ? -old.amount : old.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}

			if (updated.walletId && updated.status !== "scheduled") {
				newState.wallets = (newState.wallets || []).map((w) => {
					if (w.id === updated.walletId) {
						const change =
							updated.type === "income" ? updated.amount : -updated.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}

			return newState;
		});
	};

	const deleteTransaction = (id: string) => {
		setState((prev) => {
			const old = prev.transactions.find((t) => t.id === id);
			if (!old) return prev;

			const recurringTransactions =
				old.recurringId != null
					? (prev.recurringTransactions || []).map((r) => {
							if (r.id !== old.recurringId) return r;
							const alreadySkipped = r.skippedDates?.some((d) =>
								isSameDay(parseISO(d), parseISO(old.date)),
							);
							if (alreadySkipped) return r;
							return {
								...r,
								skippedDates: [...(r.skippedDates || []), old.date],
							};
						})
					: (prev.recurringTransactions || []);

			const newState = {
				...prev,
				transactions: prev.transactions.filter((t) => t.id !== id),
				recurringTransactions,
			};

			if (old.walletId && old.status !== "scheduled") {
				newState.wallets = (prev.wallets || []).map((w) => {
					if (w.id === old.walletId) {
						const change = old.type === "income" ? -old.amount : old.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}

			return newState;
		});
	};

	const addRecurringTransaction = (recurring: RecurringTransaction) => {
		setState((prev) => ({
			...prev,
			recurringTransactions: [...(prev.recurringTransactions || []), recurring],
		}));
		return recurring.id;
	};

	const updateRecurringTransaction = (updated: RecurringTransaction) => {
		setState((prev) => ({
			...prev,
			recurringTransactions: (prev.recurringTransactions || []).map((r) =>
				r.id === updated.id ? updated : r,
			),
		}));
	};

	const deleteRecurringTransaction = (id: string) => {
		setState((prev) => ({
			...prev,
			recurringTransactions: (prev.recurringTransactions || []).filter(
				(r) => r.id !== id,
			),
		}));
	};

	const skipRecurringDate = (recurringId: string, date: string) => {
		setState((prev) => ({
			...prev,
			recurringTransactions: (prev.recurringTransactions || []).map((r) => {
				if (r.id === recurringId) {
					return {
						...r,
						skippedDates: [...(r.skippedDates || []), date],
					};
				}
				return r;
			}),
		}));
	};

	return {
		addTransaction,
		updateTransaction,
		deleteTransaction,
		addRecurringTransaction,
		updateRecurringTransaction,
		deleteRecurringTransaction,
		skipRecurringDate,
	};
}

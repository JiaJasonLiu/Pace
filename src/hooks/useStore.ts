import { startOfDay, startOfWeek } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { defaultCategories } from "../constants";
import {
	loadAppState,
	migrateLocalStorageToDexieIfNeeded,
	persistAppState,
} from "../db/persistence";
import { processRecurring } from "../lib/finance";
import { defaultAppState } from "../state/defaultAppState";
import type {
	AppState,
	Category,
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
	RecurringTransaction,
	Transaction,
	Wallet,
} from "../types";

const PERSIST_DEBOUNCE_MS = 250;

export function useStore() {
	const [state, setState] = useState<AppState>(defaultAppState);
	const [isReady, setIsReady] = useState(false);
	const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await migrateLocalStorageToDexieIfNeeded();
				const loaded = await loadAppState();
				if (!cancelled) {
					setState(loaded);
					setIsReady(true);
				}
			} catch (e) {
				console.error("Failed to load app data from IndexedDB", e);
				if (!cancelled) {
					setState(defaultAppState);
					setIsReady(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!isReady) return;
		if (persistTimerRef.current) {
			clearTimeout(persistTimerRef.current);
		}
		persistTimerRef.current = setTimeout(() => {
			persistTimerRef.current = null;
			persistAppState(state).catch((e) =>
				console.error("Failed to persist app data", e),
			);
		}, PERSIST_DEBOUNCE_MS);
		return () => {
			if (persistTimerRef.current) {
				clearTimeout(persistTimerRef.current);
				persistTimerRef.current = null;
			}
		};
	}, [state, isReady]);

	// Consolidate recurring transaction processing and salary sync
	useEffect(() => {
		if (!isReady) return;
		setState((prev) => {
			let hasChanges = false;
			let nextRecurring = [...prev.recurringTransactions];
			const nextWallets = [...prev.wallets];
			const nextTransactions = [...prev.transactions];

			// 1. Sync Salary
			const defaultWallet = nextWallets.find(
				(w) => w.isDefault && w.type === "normal",
			);
			const salaryTransactions = nextRecurring.filter(
				(r) => r.description === "Salary" && r.type === "income",
			);

			if (
				!defaultWallet ||
				!defaultWallet.monthlyIncome ||
				defaultWallet.monthlyIncome <= 0
			) {
				if (salaryTransactions.length > 0) {
					nextRecurring = nextRecurring.filter(
						(r) => r.description !== "Salary" || r.type !== "income",
					);
					hasChanges = true;
				}
			} else {
				const monthlyIncomeValue = defaultWallet.monthlyIncome;
				const fixedCosts = nextRecurring
					.filter(
						(r) =>
							r.isActive &&
							r.isFixedCost &&
							r.type === "expense" &&
							r.walletId === defaultWallet.id,
					)
					.reduce((acc, r) => {
						const monthlyAmount =
							r.recurrence === "weekly" ? r.amount * 4.33 : r.amount;
						return acc + monthlyAmount;
					}, 0);

				const netMonthlyIncome = monthlyIncomeValue - fixedCosts;
				const netWeeklyBudget = Math.floor(netMonthlyIncome / 4.33);

				if (salaryTransactions.length > 0) {
					const keepSalary = salaryTransactions[0];

					// Remove duplicates if any exist
					if (salaryTransactions.length > 1) {
						nextRecurring = nextRecurring.filter(
							(r) =>
								r.id === keepSalary.id ||
								r.description !== "Salary" ||
								r.type !== "income",
						);
						hasChanges = true;
					}

					if (
						Math.abs(keepSalary.amount - netWeeklyBudget) > 0.001 ||
						keepSalary.recurrence !== "weekly" ||
						keepSalary.walletId !== defaultWallet.id ||
						keepSalary.isFixedCost !== true
					) {
						nextRecurring = nextRecurring.map((r) =>
							r.id === keepSalary.id
								? {
										...r,
										amount: netWeeklyBudget,
										recurrence: "weekly",
										walletId: defaultWallet.id,
										isFixedCost: true,
									}
								: r,
						);
						hasChanges = true;
					}
				} else {
					const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
					nextRecurring.push({
						id: crypto.randomUUID(),
						amount: netWeeklyBudget,
						category: "Salary",
						type: "income",
						description: "Salary",
						recurrence: "weekly",
						startDate: monday.toISOString().split("T")[0],
						walletId: defaultWallet.id,
						isActive: true,
						isFixedCost: true,
					});
					hasChanges = true;
				}
			}

			// 2. Process Recurring
			const {
				nextRecurring: processedRecurring,
				nextTransactions: processedTransactions,
				nextWallets: processedWallets,
				hasChanges: recurHasChanges,
			} = processRecurring(
				nextRecurring,
				nextTransactions,
				nextWallets,
				startOfDay(new Date()),
			);

			if (hasChanges || recurHasChanges) {
				return {
					...prev,
					transactions: processedTransactions,
					recurringTransactions: processedRecurring,
					wallets: processedWallets,
				};
			}

			return prev;
		});
	}, [isReady]);

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

			// Revert old transaction balance
			if (old.walletId && old.status !== "scheduled") {
				newState.wallets = (newState.wallets || []).map((w) => {
					if (w.id === old.walletId) {
						const change = old.type === "income" ? -old.amount : old.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}

			// Apply new transaction balance
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

			const newState = {
				...prev,
				transactions: prev.transactions.filter((t) => t.id !== id),
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

	const addGoal = (goal: LifestyleGoal) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: [...prev.lifestyleGoals, goal],
		}));
	};

	const updateGoal = (updated: LifestyleGoal) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: prev.lifestyleGoals.map((g) =>
				g.id === updated.id ? updated : g,
			),
		}));
	};

	const deleteGoal = (id: string) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: prev.lifestyleGoals.filter((g) => g.id !== id),
		}));
	};

	const addCategory = (category: Category) => {
		setState((prev) => ({
			...prev,
			categories: [...(prev.categories || defaultCategories), category],
		}));
	};

	const updateCategory = (updated: Category) => {
		setState((prev) => ({
			...prev,
			categories: (prev.categories || defaultCategories).map((c) =>
				c.id === updated.id ? updated : c,
			),
		}));
	};

	const deleteCategory = (id: string) => {
		setState((prev) => ({
			...prev,
			categories: (prev.categories || defaultCategories)
				.filter((c) => c.id !== id)
				.map((c) =>
					c.mainCategoryId === id ? { ...c, mainCategoryId: undefined } : c,
				),
		}));
	};

	const addWallet = (wallet: Wallet) => {
		setState((prev) => {
			const wallets = prev.wallets || [];
			const updatedWallets =
				wallet.isDefault && wallet.type === "normal"
					? wallets.map((w) => ({ ...w, isDefault: false }))
					: wallets;

			return {
				...prev,
				wallets: [
					...updatedWallets,
					{
						...wallet,
						isDefault:
							wallets.length === 0 && wallet.type === "normal"
								? true
								: wallet.type === "normal"
									? wallet.isDefault
									: false,
					},
				],
			};
		});
	};

	const updateWallet = (updated: Wallet) => {
		setState((prev) => {
			const wallets = prev.wallets || [];
			let updatedWallets = wallets.map((w) =>
				w.id === updated.id ? updated : w,
			);

			if (updated.isDefault && updated.type === "normal") {
				updatedWallets = updatedWallets.map((w) =>
					w.id === updated.id ? w : { ...w, isDefault: false },
				);
			} else if (updated.type === "savings") {
				updatedWallets = updatedWallets.map((w) =>
					w.id === updated.id ? { ...w, isDefault: false } : w,
				);
			}

			return {
				...prev,
				wallets: updatedWallets,
			};
		});
	};

	const deleteWallet = (id: string) => {
		setState((prev) => ({
			...prev,
			wallets: (prev.wallets || []).filter((w) => w.id !== id),
		}));
	};

	const setCurrency = (currency: string) => {
		setState((prev) => ({
			...prev,
			currency,
		}));
	};

	const updateLifestyleSettings = (settings: LifestyleSettings) => {
		setState((prev) => ({
			...prev,
			lifestyleSettings: settings,
		}));
	};

	const updateMotivationalEarning = (
		motivationalEarning: MotivationalEarning,
	) => {
		setState((prev) => ({
			...prev,
			motivationalEarning,
		}));
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

	const importData = (data: Partial<AppState>) => {
		setState((prev) => ({
			...prev,
			transactions: data.transactions || prev.transactions,
			lifestyleGoals: data.lifestyleGoals || prev.lifestyleGoals,
			categories: data.categories || prev.categories || defaultCategories,
			wallets: data.wallets || prev.wallets || [],
			currency: data.currency || prev.currency || "USD",
			lifestyleSettings:
				data.lifestyleSettings ||
				prev.lifestyleSettings ||
				defaultAppState.lifestyleSettings,
		}));
	};

	const clearData = () => {
		setState(defaultAppState);
	};

	return {
		isReady,
		state,
		addTransaction,
		updateTransaction,
		deleteTransaction,
		addGoal,
		updateGoal,
		deleteGoal,
		addCategory,
		updateCategory,
		deleteCategory,
		addWallet,
		updateWallet,
		deleteWallet,
		setCurrency,
		updateLifestyleSettings,
		updateMotivationalEarning,
		addRecurringTransaction,
		updateRecurringTransaction,
		deleteRecurringTransaction,
		skipRecurringDate,
		importData,
		clearData,
	};
}

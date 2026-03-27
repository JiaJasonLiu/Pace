import { startOfDay, startOfWeek } from "date-fns";
import { processRecurring } from "./finance";
import type { AppState, Transaction, Wallet } from "../types";

/** Salary alignment + recurring generation; mirrors former useStore bootstrap logic. */
export function applySalaryAndRecurringSync(prev: AppState): {
	next: AppState;
	changed: boolean;
} {
	let hasChanges = false;
	let nextRecurring = [...prev.recurringTransactions];
	const nextWallets = [...prev.wallets];
	const nextTransactions = [...prev.transactions];

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

	const changed = hasChanges || recurHasChanges;
	if (!changed) {
		return { next: prev, changed: false };
	}

	return {
		next: {
			...prev,
			transactions: processedTransactions,
			recurringTransactions: processedRecurring,
			wallets: processedWallets,
		},
		changed: true,
	};
}

export function walletBalanceDeltaForTransaction(
	t: Pick<Transaction, "type" | "amount" | "status" | "walletId">,
): number {
	if (!t.walletId || t.status === "scheduled") return 0;
	return t.type === "income" ? t.amount : -t.amount;
}

export function revertWalletBalances(
	wallets: Wallet[],
	transactions: Transaction[],
): Wallet[] {
	let next = [...wallets];
	for (const t of transactions) {
		const d = walletBalanceDeltaForTransaction(t);
		if (d === 0) continue;
		next = next.map((w) =>
			w.id === t.walletId ? { ...w, balance: w.balance - d } : w,
		);
	}
	return next;
}

export function applyWalletBalances(
	wallets: Wallet[],
	transactions: Transaction[],
): Wallet[] {
	let next = [...wallets];
	for (const t of transactions) {
		const d = walletBalanceDeltaForTransaction(t);
		if (d === 0) continue;
		next = next.map((w) =>
			w.id === t.walletId ? { ...w, balance: w.balance + d } : w,
		);
	}
	return next;
}

import { startOfDay, startOfWeek } from "date-fns";
import { processRecurring } from "../../lib/finance";
import type { AppState } from "../../types";

/** Salary sync + recurring generation; returns `prev` when nothing changed. */
export function applySalaryRecurringSync(prev: AppState): AppState {
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

	if (hasChanges || recurHasChanges) {
		return {
			...prev,
			transactions: processedTransactions,
			recurringTransactions: processedRecurring,
			wallets: processedWallets,
		};
	}

	return prev;
}

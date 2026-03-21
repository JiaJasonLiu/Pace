import { addMonths, addWeeks, isBefore, isSameDay, parseISO } from "date-fns";
import type { RecurringTransaction, Transaction, Wallet } from "../types";

export const DEFAULT_PERCENTAGES = { need: 50, want: 30, savings: 20 };

export const calculateBudget = (
	totalIncome: number,
	percentages: {
		need: number;
		want: number;
		savings: number;
	} = DEFAULT_PERCENTAGES,
) => {
	return {
		need: totalIncome * (percentages.need / 100),
		want: totalIncome * (percentages.want / 100),
		savings: totalIncome * (percentages.savings / 100),
	};
};

export const processRecurring = (
	recurringTransactions: RecurringTransaction[],
	existingTransactions: Transaction[],
	wallets: Wallet[],
	now: Date,
) => {
	let hasChanges = false;
	const nextRecurring = [...recurringTransactions];
	let nextWallets = [...wallets];
	let nextTransactions = [...existingTransactions];
	const newTransactions: Transaction[] = [];

	// 1. Sync Salary logic (if needed, but this part is more store-specific)

	// 2. Process Recurring
	nextRecurring.forEach((r) => {
		if (!r.isActive) return;

		const lastDate = r.lastGeneratedDate ? parseISO(r.lastGeneratedDate) : null;
		let nextDate = lastDate
			? r.recurrence === "weekly"
				? addWeeks(lastDate, 1)
				: addMonths(lastDate, 1)
			: parseISO(r.startDate);

		let currentLastDate = lastDate;
		let localHasChanges = false;

		while (isBefore(nextDate, now) || isSameDay(nextDate, now)) {
			const isSkipped = r.skippedDates?.some((d) =>
				isSameDay(parseISO(d), nextDate),
			);

			if (!isSkipped) {
				const alreadyExists = nextTransactions.some(
					(t) =>
						t.recurringId === r.id && isSameDay(parseISO(t.date), nextDate),
				);

				if (!alreadyExists) {
					newTransactions.push({
						id: crypto.randomUUID(),
						date: nextDate.toISOString(),
						amount: r.amount,
						type: r.type,
						category: r.category,
						description: r.description,
						walletId: r.walletId,
						recurringId: r.id,
						status: "posted",
					});
				}
			}
			currentLastDate = nextDate;
			nextDate =
				r.recurrence === "weekly"
					? addWeeks(nextDate, 1)
					: addMonths(nextDate, 1);
			localHasChanges = true;
		}

		if (localHasChanges) {
			r.lastGeneratedDate = currentLastDate?.toISOString();
			hasChanges = true;
		}
	});

	if (newTransactions.length > 0) {
		nextTransactions = [...nextTransactions, ...newTransactions];
		newTransactions.forEach((t) => {
			if (t.walletId) {
				nextWallets = nextWallets.map((w) => {
					if (w.id === t.walletId) {
						const change = t.type === "income" ? t.amount : -t.amount;
						return { ...w, balance: w.balance + change };
					}
					return w;
				});
			}
		});
		hasChanges = true;
	}

	return {
		nextRecurring,
		nextTransactions,
		nextWallets,
		hasChanges,
	};
};

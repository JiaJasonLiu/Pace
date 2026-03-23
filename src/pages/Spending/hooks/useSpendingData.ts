import {
	addMonths,
	addWeeks,
	isAfter,
	isBefore,
	isSameDay,
	isSameWeek,
	parseISO,
	startOfDay,
	startOfWeek,
	endOfWeek,
} from "date-fns";
import type { Transaction, RecurringTransaction } from "../../../types";

export function useSpendingData(
	transactions: Transaction[],
	recurringTransactions: RecurringTransaction[],
	currentDate: Date,
) {
	const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

	const thisWeekTransactions = transactions.filter((t) =>
		isSameWeek(parseISO(t.date), currentDate, { weekStartsOn: 1 }),
	);

	const scheduledTransactions: Transaction[] = [];
	const now = startOfDay(new Date());

	recurringTransactions.forEach((r) => {
		if (!r.isActive) return;

		const start = parseISO(r.startDate);
		let checkDate = start;
		let foundNext = false;
		let iterations = 0;

		while (!foundNext && iterations < 100) {
			iterations++;
			if (isBefore(checkDate, now)) {
				checkDate =
					r.recurrence === "weekly"
						? addWeeks(checkDate, 1)
						: addMonths(checkDate, 1);
				continue;
			}

			const isAlreadyPosted = transactions.some(
				(t) => t.recurringId === r.id && isSameDay(parseISO(t.date), checkDate),
			);
			const isSkipped = r.skippedDates?.some((d) =>
				isSameDay(parseISO(d), checkDate),
			);

			if (isAlreadyPosted || isSkipped) {
				checkDate =
					r.recurrence === "weekly"
						? addWeeks(checkDate, 1)
						: addMonths(checkDate, 1);
				continue;
			}
			foundNext = true;
		}

		if (
			foundNext &&
			(isSameDay(checkDate, weekStart) || isAfter(checkDate, weekStart)) &&
			(isSameDay(checkDate, weekEnd) || isBefore(checkDate, weekEnd))
		) {
			scheduledTransactions.push({
				id: `scheduled-${r.id}-${checkDate.getTime()}`,
				amount: r.amount,
				type: r.type,
				category: r.category,
				description: r.description,
				date: checkDate.toISOString(),
				walletId: r.walletId,
				recurringId: r.id,
				status: "scheduled",
				isFixedCost: r.isFixedCost,
			});
		}
	});

	const allDisplayTransactions = [
		...thisWeekTransactions,
		...scheduledTransactions,
	]
		.filter(
			(t) =>
				!(
					t.status === "scheduled" &&
					isBefore(parseISO(t.date), startOfDay(new Date()))
				),
		)
		.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

	const postedTransactions = thisWeekTransactions.filter(
		(t) => !t.status || t.status === "posted",
	);
	
	const weeklyIncome = postedTransactions
		.filter((t) => t.type === "income")
		.reduce((acc, t) => acc + t.amount, 0);
	const weeklyExpense = postedTransactions
		.filter((t) => t.type === "expense" && !t.isFixedCost)
		.reduce((acc, t) => acc + t.amount, 0);
	const weeklyBalance = weeklyIncome - weeklyExpense;

	return {
		allDisplayTransactions,
		weeklyIncome,
		weeklyExpense,
		weeklyBalance,
		weekStart,
		weekEnd,
	};
}

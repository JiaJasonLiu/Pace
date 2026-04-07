import {
	addMonths,
	addWeeks,
	format,
	isBefore,
	isSameDay,
	parseISO,
	startOfDay,
} from "date-fns";
import type {
	RecurrenceType,
	RecurringTransaction,
	Transaction,
	TransactionType,
} from "../types";

/** Virtual scheduled rows are not persisted; id is only for UI keys and swipe/skip. */
export function encodeScheduledVirtualId(
	recurringId: string,
	occurrenceDate: Date,
): string {
	const key = format(startOfDay(occurrenceDate), "yyyy-MM-dd");
	// UUIDs use hyphens only; `_` separates rule id from yyyy-MM-dd.
	return `scheduled-${recurringId}_${key}`;
}

export function isVirtualScheduledId(id: string): boolean {
	return id.startsWith("scheduled-");
}

export function isDateOnRecurrenceGrid(
	rule: RecurringTransaction,
	target: Date,
): boolean {
	const start = startOfDay(parseISO(rule.startDate.split("T")[0]));
	const t = startOfDay(target);
	if (isBefore(t, start)) return false;

	if (rule.recurrence === "weekly") {
		let d = start;
		let guard = 0;
		while (isBefore(d, t) && guard++ < 2000) {
			d = addWeeks(d, 1);
		}
		return isSameDay(d, t);
	}

	let d = start;
	let guard = 0;
	while (isBefore(d, t) && guard++ < 500) {
		d = addMonths(d, 1);
	}
	return isSameDay(d, t);
}

export function transactionExistsForRecurringOccurrence(
	transactions: Transaction[],
	recurringId: string,
	occurrenceDay: Date,
): boolean {
	const day = startOfDay(occurrenceDay);
	return transactions.some(
		(t) =>
			t.recurringId === recurringId && isSameDay(parseISO(t.date), day),
	);
}

/**
 * When adding a new transaction with recurrence, reuse an existing rule if the
 * date falls on that rule’s schedule and metadata matches — avoids duplicate rules
 * and keeps the virtual “scheduled” row from staying alongside a new copy.
 */
export function findMatchingRecurringForNewTransaction(
	rules: RecurringTransaction[],
	transactions: Transaction[],
	input: {
		date: string;
		recurrence: RecurrenceType;
		category: string;
		type: TransactionType;
		walletId?: string;
	},
): RecurringTransaction | undefined {
	const target = startOfDay(
		parseISO(input.date.split("T")[0] || input.date),
	);

	return rules.find((r) => {
		if (!r.isActive || r.recurrence !== input.recurrence) return false;
		if (r.category !== input.category || r.type !== input.type) return false;
		if ((r.walletId ?? "") !== (input.walletId ?? "")) return false;
		if (!isDateOnRecurrenceGrid(r, target)) return false;
		if (transactionExistsForRecurringOccurrence(transactions, r.id, target)) {
			return false;
		}
		return true;
	});
}

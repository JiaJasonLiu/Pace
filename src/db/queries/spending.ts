import type { PaceDb } from "../client";
import type { RecurringTransaction, Transaction } from "../../types";

export async function insertTransaction(
	db: PaceDb,
	transaction: Transaction,
): Promise<void> {
	const t = {
		...transaction,
		status: transaction.status || "posted",
	};
	await db
		.prepare(
			`INSERT INTO transactions (id, date, amount, type, category, description, wallet_id, recurring_id, status, is_fixed_cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			t.id,
			t.date,
			t.amount,
			t.type,
			t.category,
			t.description,
			t.walletId ?? null,
			t.recurringId ?? null,
			t.status,
			t.isFixedCost == null ? null : t.isFixedCost ? 1 : 0,
		);

	if (t.walletId && t.status !== "scheduled") {
		const d = t.type === "income" ? t.amount : -t.amount;
		await db
			.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?")
			.run(d, t.walletId);
	}
}

export async function updateTransaction(
	db: PaceDb,
	updated: Transaction,
): Promise<void> {
	const old = await db
		.prepare("SELECT * FROM transactions WHERE id = ?")
		.get(updated.id);
	if (!old) return;

	const o = old as {
		wallet_id: string | null;
		status: string;
		type: string;
		amount: number;
	};

	if (o.wallet_id && o.status !== "scheduled") {
		const rev = o.type === "income" ? -o.amount : o.amount;
		await db
			.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?")
			.run(rev, o.wallet_id);
	}

	await db
		.prepare(
			`UPDATE transactions SET date = ?, amount = ?, type = ?, category = ?, description = ?, wallet_id = ?, recurring_id = ?, status = ?, is_fixed_cost = ?
     WHERE id = ?`,
		)
		.run(
			updated.date,
			updated.amount,
			updated.type,
			updated.category,
			updated.description,
			updated.walletId ?? null,
			updated.recurringId ?? null,
			updated.status ?? "posted",
			updated.isFixedCost == null ? null : updated.isFixedCost ? 1 : 0,
			updated.id,
		);

	if (updated.walletId && (updated.status ?? "posted") !== "scheduled") {
		const d = updated.type === "income" ? updated.amount : -updated.amount;
		await db
			.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?")
			.run(d, updated.walletId);
	}
}

export async function deleteTransaction(db: PaceDb, id: string): Promise<void> {
	const old = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
	if (!old) return;

	const o = old as {
		wallet_id: string | null;
		status: string;
		type: string;
		amount: number;
	};

	if (o.wallet_id && o.status !== "scheduled") {
		const rev = o.type === "income" ? -o.amount : o.amount;
		await db
			.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?")
			.run(rev, o.wallet_id);
	}

	await db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
}

export async function insertRecurring(
	db: PaceDb,
	r: RecurringTransaction,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO recurring_transactions (id, amount, type, category, description, wallet_id, recurrence, start_date, last_generated_date, skipped_dates_json, is_active, is_fixed_cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			r.id,
			r.amount,
			r.type,
			r.category,
			r.description,
			r.walletId ?? null,
			r.recurrence,
			r.startDate,
			r.lastGeneratedDate ?? null,
			r.skippedDates?.length ? JSON.stringify(r.skippedDates) : null,
			r.isActive ? 1 : 0,
			r.isFixedCost == null ? null : r.isFixedCost ? 1 : 0,
		);
}

export async function updateRecurring(
	db: PaceDb,
	r: RecurringTransaction,
): Promise<void> {
	await db
		.prepare(
			`UPDATE recurring_transactions SET amount = ?, type = ?, category = ?, description = ?, wallet_id = ?, recurrence = ?, start_date = ?, last_generated_date = ?, skipped_dates_json = ?, is_active = ?, is_fixed_cost = ?
     WHERE id = ?`,
		)
		.run(
			r.amount,
			r.type,
			r.category,
			r.description,
			r.walletId ?? null,
			r.recurrence,
			r.startDate,
			r.lastGeneratedDate ?? null,
			r.skippedDates?.length ? JSON.stringify(r.skippedDates) : null,
			r.isActive ? 1 : 0,
			r.isFixedCost == null ? null : r.isFixedCost ? 1 : 0,
			r.id,
		);
}

export async function deleteRecurring(db: PaceDb, id: string): Promise<void> {
	await db.prepare("DELETE FROM recurring_transactions WHERE id = ?").run(id);
}

export async function skipRecurringDate(
	db: PaceDb,
	recurringId: string,
	date: string,
): Promise<void> {
	const row = await db
		.prepare("SELECT skipped_dates_json FROM recurring_transactions WHERE id = ?")
		.get(recurringId);
	if (!row) return;
	const raw = (row as { skipped_dates_json: string | null }).skipped_dates_json;
	const list: string[] = raw ? JSON.parse(raw) : [];
	if (!list.includes(date)) list.push(date);
	await db
		.prepare(
			"UPDATE recurring_transactions SET skipped_dates_json = ? WHERE id = ?",
		)
		.run(JSON.stringify(list), recurringId);
}

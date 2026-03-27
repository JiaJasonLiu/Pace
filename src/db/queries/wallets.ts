import type { PaceDb } from "../client";
import type { Wallet } from "../../types";

export async function insertWallet(db: PaceDb, wallet: Wallet): Promise<void> {
	const rows = await db.prepare("SELECT id FROM wallets").all();
	const count = (rows as { id: string }[]).length;

	if (wallet.isDefault && wallet.type === "normal") {
		await db.prepare("UPDATE wallets SET is_default = 0").run();
	}

	const isDefault =
		count === 0 && wallet.type === "normal"
			? true
			: wallet.type === "normal"
				? Boolean(wallet.isDefault)
				: false;

	await db
		.prepare(
			`INSERT INTO wallets (id, name, balance, monthly_income, type, is_default, savings_goal, savings_end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			wallet.id,
			wallet.name,
			wallet.balance,
			wallet.monthlyIncome ?? null,
			wallet.type,
			isDefault ? 1 : 0,
			wallet.savingsGoal ?? null,
			wallet.savingsEndDate ?? null,
		);
}

export async function updateWallet(db: PaceDb, updated: Wallet): Promise<void> {
	if (updated.isDefault && updated.type === "normal") {
		await db.prepare("UPDATE wallets SET is_default = 0").run();
	} else if (updated.type === "savings") {
		await db
			.prepare("UPDATE wallets SET is_default = 0 WHERE id = ?")
			.run(updated.id);
	}

	await db
		.prepare(
			`UPDATE wallets SET name = ?, balance = ?, monthly_income = ?, type = ?, is_default = ?, savings_goal = ?, savings_end_date = ?
     WHERE id = ?`,
		)
		.run(
			updated.name,
			updated.balance,
			updated.monthlyIncome ?? null,
			updated.type,
			updated.type === "normal" && updated.isDefault ? 1 : 0,
			updated.savingsGoal ?? null,
			updated.savingsEndDate ?? null,
			updated.id,
		);
}

export async function deleteWallet(db: PaceDb, id: string): Promise<void> {
	await db.prepare("DELETE FROM wallets WHERE id = ?").run(id);
}

import type { PaceDb } from "../client";
import type { LifestyleGoal, LifestyleSettings, MotivationalEarning } from "../../types";

export async function insertGoal(db: PaceDb, goal: LifestyleGoal): Promise<void> {
	await db
		.prepare(
			`INSERT INTO lifestyle_goals (id, title, target_amount, current_amount, target_date, description, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			goal.id,
			goal.title,
			goal.targetAmount,
			goal.currentAmount ?? null,
			goal.targetDate ?? null,
			goal.description,
			goal.category,
		);
}

export async function updateGoal(db: PaceDb, goal: LifestyleGoal): Promise<void> {
	await db
		.prepare(
			`UPDATE lifestyle_goals SET title = ?, target_amount = ?, current_amount = ?, target_date = ?, description = ?, category = ?
     WHERE id = ?`,
		)
		.run(
			goal.title,
			goal.targetAmount,
			goal.currentAmount ?? null,
			goal.targetDate ?? null,
			goal.description,
			goal.category,
			goal.id,
		);
}

export async function deleteGoal(db: PaceDb, id: string): Promise<void> {
	await db.prepare("DELETE FROM lifestyle_goals WHERE id = ?").run(id);
}

export async function updateLifestyleSettingsJson(
	db: PaceDb,
	settings: LifestyleSettings,
): Promise<void> {
	await db
		.prepare(
			"UPDATE app_settings SET lifestyle_settings_json = ? WHERE id = 1",
		)
		.run(JSON.stringify(settings));
}

export async function updateMotivationalEarningJson(
	db: PaceDb,
	me: MotivationalEarning,
): Promise<void> {
	await db
		.prepare(
			"UPDATE app_settings SET motivational_earning_json = ? WHERE id = 1",
		)
		.run(JSON.stringify(me));
}

import { assertBrowserSupportsPaceDb } from "../lib/dbEnvironment";
// Main package entry uses `worker.js` + fetched WASM. The `/vite` subpath swaps in a
// dev-only hack (`Worker(import.meta.url)`) that breaks Firefox (worker undefined / whenLoaded).
import { connect } from "@tursodatabase/database-wasm";
import { runMigrations } from "./migrations";

export type PaceDb = Awaited<ReturnType<typeof connect>>;

export async function openPaceDatabase(): Promise<PaceDb> {
	assertBrowserSupportsPaceDb();
	const db = await connect("royal-budget.db");
	await runMigrations(db);
	return db;
}

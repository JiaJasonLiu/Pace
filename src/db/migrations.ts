import type { Database } from "@tursodatabase/database-wasm/vite";

const MIGRATIONS: string[] = [
	`
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  currency TEXT NOT NULL DEFAULT 'USD',
  lifestyle_settings_json TEXT,
  motivational_earning_json TEXT
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  monthly_income REAL,
  type TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  savings_goal REAL,
  savings_end_date TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  wallet_id TEXT,
  recurring_id TEXT,
  status TEXT NOT NULL DEFAULT 'posted',
  is_fixed_cost INTEGER,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  wallet_id TEXT,
  recurrence TEXT NOT NULL,
  start_date TEXT NOT NULL,
  last_generated_date TEXT,
  skipped_dates_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_fixed_cost INTEGER,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  lifestyle_type TEXT,
  main_category_id TEXT
);

CREATE TABLE IF NOT EXISTS lifestyle_goals (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL,
  target_date TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
`,
];

export async function runMigrations(db: Database): Promise<void> {
	await db.exec("PRAGMA foreign_keys = ON;");
	await db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL
);
`);
	const row = await db
		.prepare("SELECT MAX(version) as v FROM schema_migrations")
		.get();
	const current = (row as { v: number | null })?.v ?? 0;

	for (let i = current; i < MIGRATIONS.length; i++) {
		const version = i + 1;
		await db.exec("BEGIN");
		try {
			await db.exec(MIGRATIONS[i]);
			await db
				.prepare("INSERT INTO schema_migrations (version) VALUES (?)")
				.run(version);
			await db.exec("COMMIT");
		} catch (e) {
			await db.exec("ROLLBACK");
			throw e;
		}
	}

	const settingsCount = await db
		.prepare("SELECT COUNT(*) as c FROM app_settings")
		.get();
	if ((settingsCount as { c: number }).c === 0) {
		await db
			.prepare(
				"INSERT INTO app_settings (id, currency) VALUES (1, 'USD')",
			)
			.run();
	}
}

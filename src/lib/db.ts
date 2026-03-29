import { connect, Database } from '@tursodatabase/database-wasm/vite';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  // Connect to a local database file stored in OPFS
  try {
    console.log("Initializing database...");
    db = await connect('local.db');

  // Optional: Create a sample table for first-time users
    // await db.exec(`
    //   CREATE TABLE IF NOT EXISTS query_history (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     query TEXT NOT NULL,
    //     executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);
    console.log("Database initialized successfully.", db);
  } catch (error) {
    console.error('Error creating table:', error);
  }

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { applySalaryAndRecurringSync } from "../lib/financeSync";
import type { AppState } from "../types";
import { openPaceDatabase, type PaceDb } from "./client";
import { migrateFromLocalStorageIfNeeded } from "./migrateFromLocalStorage";
import {
	loadAppState,
	replaceTransactionsRecurringWallets,
} from "./queries/shared";

export type PaceAppReady = {
	status: "ready";
	db: PaceDb;
	state: AppState;
	refresh: () => Promise<void>;
};

export type PaceAppState =
	| { status: "loading" }
	| { status: "error"; error: Error }
	| PaceAppReady;

const PaceAppContext = createContext<PaceAppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
	const [phase, setPhase] = useState<PaceAppState>({ status: "loading" });
	const dbRef = useRef<PaceDb | null>(null);

	const loadSyncedState = useCallback(async (db: PaceDb) => {
		const s = await loadAppState(db);
		const { next, changed } = applySalaryAndRecurringSync(s);
		if (changed) {
			await replaceTransactionsRecurringWallets(db, next);
			return next;
		}
		return s;
	}, []);

	const refreshFromDb = useCallback(async () => {
		const db = dbRef.current;
		if (!db) return;
		const s = await loadSyncedState(db);
		setPhase((p) => (p.status === "ready" ? { ...p, state: s } : p));
	}, [loadSyncedState]);

	useEffect(() => {
		let cancelled = false;
		let database: PaceDb | null = null;
		setPhase({ status: "loading" });
		dbRef.current = null;

		(async () => {
			try {
				database = await openPaceDatabase();
				if (cancelled) {
					await database.close();
					return;
				}
				await migrateFromLocalStorageIfNeeded(database);
				const state = await loadSyncedState(database);
				if (cancelled) {
					await database.close();
					return;
				}
				dbRef.current = database;
				setPhase({
					status: "ready",
					db: database,
					state,
					refresh: refreshFromDb,
				});
			} catch (e) {
				if (!cancelled) {
					setPhase({
						status: "error",
						error: e instanceof Error ? e : new Error(String(e)),
					});
				}
				if (database && !cancelled) {
					try {
						await database.close();
					} catch {
						/* ignore */
					}
				}
			}
		})();

		return () => {
			cancelled = true;
			dbRef.current = null;
			void database?.close();
		};
	}, [loadSyncedState, refreshFromDb]);

	return (
		<PaceAppContext.Provider value={phase}>{children}</PaceAppContext.Provider>
	);
}

export function usePaceApp(): PaceAppState {
	const ctx = useContext(PaceAppContext);
	if (!ctx) {
		throw new Error("usePaceApp must be used within AppStateProvider");
	}
	return ctx;
}

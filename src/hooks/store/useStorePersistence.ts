import { useEffect, useRef } from "react";
import { loadAppState, persistAppState } from "../../db/persistence";
import { defaultAppState } from "../../state/defaultAppState";
import type { AppState } from "../../types";
import type { SetAppState } from "./types";

export const PERSIST_DEBOUNCE_MS = 250;

export function useStoreHydration(
	setState: SetAppState,
	setIsReady: (ready: boolean) => void,
) {
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const loaded = await loadAppState();
				if (!cancelled) {
					setState(loaded);
					setIsReady(true);
				}
			} catch (e) {
				console.error("Failed to load app data from IndexedDB", e);
				if (!cancelled) {
					setState(defaultAppState);
					setIsReady(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [setState, setIsReady]);
}

export function useDebouncedPersist(state: AppState, isReady: boolean) {
	const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!isReady) return;
		if (persistTimerRef.current) {
			clearTimeout(persistTimerRef.current);
		}
		persistTimerRef.current = setTimeout(() => {
			persistTimerRef.current = null;
			persistAppState(state).catch((e) =>
				console.error("Failed to persist app data", e),
			);
		}, PERSIST_DEBOUNCE_MS);
		return () => {
			if (persistTimerRef.current) {
				clearTimeout(persistTimerRef.current);
				persistTimerRef.current = null;
			}
		};
	}, [state, isReady]);
}

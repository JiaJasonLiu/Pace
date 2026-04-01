import { useEffect, useMemo, useState } from "react";
import { defaultAppState } from "../state/defaultAppState";
import type { AppState } from "../types";
import { applySalaryRecurringSync } from "./store/applySalaryRecurringSync";
import { createLifestyleActions } from "./store/lifestyleActions";
import { createSettingsActions } from "./store/settingsActions";
import { createSpendingActions } from "./store/spendingActions";
import {
	useDebouncedPersist,
	useStoreHydration,
} from "./store/useStorePersistence";
import { createWalletsActions } from "./store/walletsActions";

export function useStore() {
	const [state, setState] = useState<AppState>(defaultAppState);
	const [isReady, setIsReady] = useState(false);

	useStoreHydration(setState, setIsReady);
	useDebouncedPersist(state, isReady);

	useEffect(() => {
		if (!isReady) return;
		setState((prev) => applySalaryRecurringSync(prev));
	}, [isReady]);

	const actions = useMemo(
		() => ({
			...createSpendingActions(setState),
			...createWalletsActions(setState),
			...createLifestyleActions(setState),
			...createSettingsActions(setState),
		}),
		[setState],
	);

	return {
		isReady,
		state,
		...actions,
	};
}

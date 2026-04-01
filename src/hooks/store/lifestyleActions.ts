import type {
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
} from "../../types";
import type { SetAppState } from "./types";

export function createLifestyleActions(setState: SetAppState) {
	const addGoal = (goal: LifestyleGoal) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: [...prev.lifestyleGoals, goal],
		}));
	};

	const updateGoal = (updated: LifestyleGoal) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: prev.lifestyleGoals.map((g) =>
				g.id === updated.id ? updated : g,
			),
		}));
	};

	const deleteGoal = (id: string) => {
		setState((prev) => ({
			...prev,
			lifestyleGoals: prev.lifestyleGoals.filter((g) => g.id !== id),
		}));
	};

	const updateLifestyleSettings = (settings: LifestyleSettings) => {
		setState((prev) => ({
			...prev,
			lifestyleSettings: settings,
		}));
	};

	const updateMotivationalEarning = (
		motivationalEarning: MotivationalEarning,
	) => {
		setState((prev) => ({
			...prev,
			motivationalEarning,
		}));
	};

	return {
		addGoal,
		updateGoal,
		deleteGoal,
		updateLifestyleSettings,
		updateMotivationalEarning,
	};
}

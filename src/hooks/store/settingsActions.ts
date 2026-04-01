import { defaultCategories } from "../../constants";
import { defaultAppState } from "../../state/defaultAppState";
import type { AppState, Category } from "../../types";
import type { SetAppState } from "./types";

export function createSettingsActions(setState: SetAppState) {
	const addCategory = (category: Category) => {
		setState((prev) => ({
			...prev,
			categories: [...(prev.categories || defaultCategories), category],
		}));
	};

	const updateCategory = (updated: Category) => {
		setState((prev) => ({
			...prev,
			categories: (prev.categories || defaultCategories).map((c) =>
				c.id === updated.id ? updated : c,
			),
		}));
	};

	const deleteCategory = (id: string) => {
		setState((prev) => ({
			...prev,
			categories: (prev.categories || defaultCategories)
				.filter((c) => c.id !== id)
				.map((c) =>
					c.mainCategoryId === id ? { ...c, mainCategoryId: undefined } : c,
				),
		}));
	};

	const setCurrency = (currency: string) => {
		setState((prev) => ({
			...prev,
			currency,
		}));
	};

	const importData = (data: Partial<AppState>) => {
		setState((prev) => ({
			...prev,
			transactions: data.transactions || prev.transactions,
			lifestyleGoals: data.lifestyleGoals || prev.lifestyleGoals,
			categories: data.categories || prev.categories || defaultCategories,
			wallets: data.wallets || prev.wallets || [],
			currency: data.currency || prev.currency || "USD",
			lifestyleSettings:
				data.lifestyleSettings ||
				prev.lifestyleSettings ||
				defaultAppState.lifestyleSettings,
		}));
	};

	const clearData = () => {
		setState(defaultAppState);
	};

	return {
		addCategory,
		updateCategory,
		deleteCategory,
		setCurrency,
		importData,
		clearData,
	};
}

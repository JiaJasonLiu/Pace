import type { Wallet } from "../../types";
import { applySalaryRecurringSync } from "./applySalaryRecurringSync";
import type { SetAppState } from "./types";

export function createWalletsActions(setState: SetAppState) {
	const addWallet = (wallet: Wallet) => {
		setState((prev) => {
			const wallets = prev.wallets || [];
			const updatedWallets =
				wallet.isDefault && wallet.type === "normal"
					? wallets.map((w) => ({ ...w, isDefault: false }))
					: wallets;

			const next: typeof prev = {
				...prev,
				wallets: [
					...updatedWallets,
					{
						...wallet,
						isDefault:
							wallets.length === 0 && wallet.type === "normal"
								? true
								: wallet.type === "normal"
									? wallet.isDefault
									: false,
					},
				],
			};
			return applySalaryRecurringSync(next);
		});
	};

	const updateWallet = (updated: Wallet) => {
		setState((prev) => {
			const wallets = prev.wallets || [];
			let updatedWallets = wallets.map((w) =>
				w.id === updated.id ? updated : w,
			);

			if (updated.isDefault && updated.type === "normal") {
				updatedWallets = updatedWallets.map((w) =>
					w.id === updated.id ? w : { ...w, isDefault: false },
				);
			} else if (updated.type === "savings") {
				updatedWallets = updatedWallets.map((w) =>
					w.id === updated.id ? { ...w, isDefault: false } : w,
				);
			}

			const next: typeof prev = {
				...prev,
				wallets: updatedWallets,
			};
			return applySalaryRecurringSync(next);
		});
	};

	const deleteWallet = (id: string) => {
		setState((prev) => {
			const next: typeof prev = {
				...prev,
				wallets: (prev.wallets || []).filter((w) => w.id !== id),
			};
			return applySalaryRecurringSync(next);
		});
	};

	return { addWallet, updateWallet, deleteWallet };
}

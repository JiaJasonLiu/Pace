import type { Wallet } from "../../types";
import type { SetAppState } from "./types";

export function createWalletsActions(setState: SetAppState) {
	const addWallet = (wallet: Wallet) => {
		setState((prev) => {
			const wallets = prev.wallets || [];
			const updatedWallets =
				wallet.isDefault && wallet.type === "normal"
					? wallets.map((w) => ({ ...w, isDefault: false }))
					: wallets;

			return {
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

			return {
				...prev,
				wallets: updatedWallets,
			};
		});
	};

	const deleteWallet = (id: string) => {
		setState((prev) => ({
			...prev,
			wallets: (prev.wallets || []).filter((w) => w.id !== id),
		}));
	};

	return { addWallet, updateWallet, deleteWallet };
}

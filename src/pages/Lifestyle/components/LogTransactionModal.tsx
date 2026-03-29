import { AlignLeft, Calendar, Tag, Wallet as WalletIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../../../components/Modal";
import type { LogTransactionModalProps } from "../types";

export function LogTransactionModal({
	isOpen,
	onClose,
	onAddTransaction,
	categories,
	wallets,
	currency,
	initialType,
}: LogTransactionModalProps) {
	// Transaction form state
	const [tAmount, setTAmount] = useState("");
	const [tDescription, setTDescription] = useState("");
	const [tCategory, setTCategory] = useState("");
	const [tWalletId, setTWalletId] = useState("");
	const [tDate, setTDate] = useState(new Date().toISOString().split("T")[0]);
	const [tLifestyleType, setTLifestyleType] = useState<
		"need" | "want" | "savings" | "income"
	>("need");

	const amountInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			const type = initialType || "need";
			setTLifestyleType(type);

			const filteredCats = categories.filter(
				(c) => c.lifestyleType === type && c.type === "expense",
			);
			setTCategory(filteredCats[0]?.name || "");

			const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0];
			setTWalletId(defaultWallet?.id || "");

			setTAmount("");
			setTDescription("");
			setTDate(new Date().toISOString().split("T")[0]);

			// Focus the amount input
			setTimeout(() => {
				amountInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen, initialType, categories, wallets]);

	const handleLifestyleTypeChange = (
		type: "need" | "want" | "savings" | "income",
	) => {
		setTLifestyleType(type);
		const filteredCats = categories.filter(
			(c) =>
				c.lifestyleType === type &&
				c.type === (type === "income" ? "income" : "expense"),
		);
		setTCategory(filteredCats[0]?.name || "");
	};

	const handleTransactionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!tAmount || Number.isNaN(Number(tAmount)) || !tCategory || !tWalletId)
			return;

		onAddTransaction({
			id: crypto.randomUUID(),
			amount: Number(tAmount),
			description: tDescription,
			category: tCategory,
			walletId: tWalletId,
			date: new Date(tDate).toISOString(),
			type: tLifestyleType === "income" ? "income" : "expense",
		});

		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Log Lifestyle Spending"
			footer={
				<button
					type="submit"
					form="log-transaction-form"
					className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] text-sm"
				>
					Log Transaction
				</button>
			}
		>
			<form
				id="log-transaction-form"
				onSubmit={handleTransactionSubmit}
				className="space-y-3"
			>
				<div className="flex justify-center py-2 overflow-x-auto">
					<div className="flex items-center justify-center w-full">
						<span className="text-slate-400 text-xl font-medium mr-1">
							{currency === "USD" ? "$" : currency}
						</span>
						<input
							ref={amountInputRef}
							type="number"
							step="0.01"
							placeholder="0.00"
							value={tAmount}
							onChange={(e) => setTAmount(e.target.value)}
							className="bg-transparent text-4xl font-bold text-slate-800 focus:outline-none w-full text-center"
							required
						/>
					</div>
				</div>
				<p className="text-center text-xs text-slate-400 font-medium -mt-2 mb-4">
					Amount
				</p>

				<div className="flex rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
					{(["need", "want", "savings"] as const).map((type) => (
						<button
							key={type}
							type="button"
							onClick={() => handleLifestyleTypeChange(type)}
							className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${tLifestyleType === type ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
						>
							{type}
						</button>
					))}
				</div>

				<hr className="border-slate-100" />

				<div className="flex flex-col">
					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<Calendar className="w-5 h-5 text-slate-400" />
						<input
							type="date"
							value={tDate}
							onChange={(e) => setTDate(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm"
							required
						/>
					</label>

					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<Tag className="w-5 h-5 text-slate-400" />
						<select
							value={tCategory}
							onChange={(e) => setTCategory(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm appearance-none"
							required
						>
							<option value="" disabled>
								Select category
							</option>
							{categories
								.filter(
									(c) =>
										c.lifestyleType === tLifestyleType &&
										c.type ===
											(tLifestyleType === "income" ? "income" : "expense"),
								)
								.map((cat) => (
									<option key={cat.id} value={cat.name}>
										( 
										{cat.lifestyleType && cat.lifestyleType?.charAt(0).toUpperCase() +
											cat.lifestyleType.slice(1)}
										) {cat.name}
									</option>
								))}
						</select>
					</label>

					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<WalletIcon className="w-5 h-5 text-slate-400" />
						<select
							value={tWalletId}
							onChange={(e) => setTWalletId(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm appearance-none"
							required
						>
							<option value="" disabled>
								Select wallet
							</option>
							{wallets.map((w) => (
								<option key={w.id} value={w.id}>
									{w.name}
								</option>
							))}
						</select>
					</label>

					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<AlignLeft className="w-5 h-5 text-slate-400" />
						<input
							type="text"
							placeholder="Notes"
							value={tDescription}
							onChange={(e) => setTDescription(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400"
						/>
					</label>
				</div>
			</form>
		</Modal>
	);
}

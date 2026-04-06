import {
	Calendar,
	CheckCircle2,
	Edit2,
	Target,
	Trash2,
	TrendingUp,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { getCurrencySymbol } from "../../../lib/utils";
import type { Wallet } from "../../../types";
import type { WalletModalProps } from "../types";

export function WalletModal({
	isOpen,
	onClose,
	onAddWallet,
	onUpdateWallet,
	onDeleteWallet,
	editingWallet,
	currency,
	isFirstWallet,
}: WalletModalProps) {
	// Form state
	const [name, setName] = useState("");
	const [balance, setBalance] = useState("");
	const [monthlyIncome, setMonthlyIncome] = useState("");
	const [type, setType] = useState<"normal" | "savings">("normal");
	const [isDefault, setIsDefault] = useState(false);
	const [savingsGoal, setSavingsGoal] = useState("");
	const [savingsEndDate, setSavingsEndDate] = useState("");

	useEffect(() => {
		if (editingWallet) {
			setName(editingWallet.name);
			setBalance(editingWallet.balance.toString());
			setMonthlyIncome(editingWallet.monthlyIncome?.toString() || "");
			setType(editingWallet.type || "normal");
			setIsDefault(!!editingWallet.isDefault);
			setSavingsGoal(editingWallet.savingsGoal?.toString() || "");
			setSavingsEndDate(editingWallet.savingsEndDate || "");
		} else {
			setName("");
			setBalance("");
			setMonthlyIncome("");
			setType("normal");
			setIsDefault(isFirstWallet);
			setSavingsGoal("");
			setSavingsEndDate("");
		}
	}, [editingWallet, isFirstWallet]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || (balance !== "" && Number.isNaN(Number(balance))))
			return;

		const walletData: Wallet = {
			id: editingWallet?.id || crypto.randomUUID(),
			name: name.trim(),
			balance: balance === "" ? 0 : Number(balance),
			monthlyIncome:
				type === "normal" &&
				monthlyIncome &&
				!Number.isNaN(Number(monthlyIncome))
					? Number(monthlyIncome)
					: undefined,
			type,
			isDefault: type === "normal" ? isDefault : false,
			savingsGoal:
				type === "savings" && savingsGoal && !Number.isNaN(Number(savingsGoal))
					? Number(savingsGoal)
					: undefined,
			savingsEndDate:
				type === "savings" && savingsEndDate ? savingsEndDate : undefined,
		};

		if (editingWallet) {
			onUpdateWallet(walletData);
		} else {
			onAddWallet(walletData);
		}
		onClose();
	};

	const handleDelete = () => {
		if (
			editingWallet &&
			window.confirm("Are you sure you want to delete this wallet?")
		) {
			onDeleteWallet(editingWallet.id);
			onClose();
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={editingWallet ? "Edit Wallet" : "New Wallet"}
			footer={
				<div className="flex items-center gap-2">
					{editingWallet && (
						<button
							type="button"
							onClick={handleDelete}
							className="p-4 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors flex-shrink-0"
							title="Delete Wallet"
						>
							<Trash2 className="w-5 h-5" />
						</button>
					)}
					<button
						type="submit"
						form="wallet-form"
						className="flex-1 py-4 bg-royal text-white rounded-xl font-bold shadow-md shadow-royal/20 hover:bg-royal-dark transition-all active:scale-[0.98] text-sm"
					>
						{editingWallet ? "Update Wallet" : "Save Wallet"}
					</button>
				</div>
			}
		>
			<form id="wallet-form" onSubmit={handleSubmit} className="space-y-3">
				<div className="flex justify-center py-2 overflow-x-auto">
					<div className="flex items-center justify-center w-full">
						<span className="text-slate-400 text-xl font-medium mr-1">
							{getCurrencySymbol(currency)}
						</span>
						<input
							type="number"
							step="0.01"
							placeholder="0.00"
							value={balance}
							onChange={(e) => setBalance(e.target.value)}
							className="bg-transparent text-4xl font-bold text-slate-800 focus:outline-none w-full text-center"
							required
						/>
					</div>
				</div>
				<p className="text-center text-xs text-slate-400 font-medium -mt-2 mb-4">
					Current Balance
				</p>

				<div className="flex rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
					<button
						type="button"
						onClick={() => setType("normal")}
						className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "normal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						Normal
					</button>
					<button
						type="button"
						onClick={() => setType("savings")}
						className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "savings" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						Savings
					</button>
				</div>

				<hr className="border-slate-100" />

				<div className="flex flex-col">
					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<Edit2 className="w-5 h-5 text-slate-400" />
						<input
							type="text"
							placeholder="Wallet Name (e.g. Main Checking)"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400"
							required
						/>
					</label>

					{type === "normal" && (
						<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
							<TrendingUp className="w-5 h-5 text-slate-400" />
							<input
								type="number"
								step="0.01"
								placeholder="Monthly Income (Optional)"
								value={monthlyIncome}
								onChange={(e) => setMonthlyIncome(e.target.value)}
								className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400"
							/>
						</label>
					)}

					{type === "savings" && (
						<>
							<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
								<Target className="w-5 h-5 text-slate-400" />
								<input
									type="number"
									step="0.01"
									placeholder="Savings Goal (Optional)"
									value={savingsGoal}
									onChange={(e) => setSavingsGoal(e.target.value)}
									className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400"
								/>
							</label>
							<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
								<Calendar className="w-5 h-5 text-slate-400" />
								<input
									type="date"
									value={savingsEndDate}
									onChange={(e) => setSavingsEndDate(e.target.value)}
									className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm"
								/>
							</label>
						</>
					)}

					{type === "normal" && (
						<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
							<CheckCircle2 className="w-5 h-5 text-slate-400" />
							<div className="flex-1 flex justify-between items-center">
								<span className="text-slate-700 text-sm">Default Wallet</span>
								<input
									type="checkbox"
									checked={isDefault}
									onChange={(e) => setIsDefault(e.target.checked)}
									className="w-5 h-5 rounded border-slate-300 text-royal focus:ring-royal"
								/>
							</div>
						</label>
					)}
				</div>
			</form>
		</Modal>
	);
}

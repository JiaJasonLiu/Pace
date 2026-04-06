import { ShieldCheck } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { formatCurrency, getCurrencySymbol } from "../../../lib/utils";
import type { LifestyleSettingsModalProps } from "../types";

export function LifestyleSettingsModal({
	isOpen,
	onClose,
	lifestyleSettings,
	onUpdateLifestyleSettings,
	currency,
	defaultWallet,
}: LifestyleSettingsModalProps) {
	const [incomeSource, setIncomeSource] = useState<"default_wallet" | "custom">(
		lifestyleSettings?.incomeSource || "default_wallet",
	);
	const [customIncomeAmount, setCustomIncomeAmount] = useState(
		lifestyleSettings?.customIncomeAmount?.toString() || "",
	);
	const [percentages, setPercentages] = useState(
		lifestyleSettings?.percentages || { need: 50, want: 30, savings: 20 },
	);

	useEffect(() => {
		if (lifestyleSettings) {
			setIncomeSource(lifestyleSettings.incomeSource);
			setCustomIncomeAmount(
				lifestyleSettings.customIncomeAmount?.toString() || "",
			);
			setPercentages(
				lifestyleSettings.percentages || { need: 50, want: 30, savings: 20 },
			);
		}
	}, [lifestyleSettings]);

	const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault();
		const total = percentages.need + percentages.want + percentages.savings;
		if (total !== 100) {
			alert("Percentages must add up to exactly 100%");
			return;
		}
		onUpdateLifestyleSettings({
			incomeSource,
			customIncomeAmount:
				incomeSource === "custom" ? Number(customIncomeAmount) : undefined,
			percentages,
		});
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Lifestyle Settings"
			footer={
				<button
					type="submit"
					form="lifestyle-settings-form"
					className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] text-sm"
				>
					Save
				</button>
			}
		>
			<form
				id="lifestyle-settings-form"
				onSubmit={handleSaveSettings}
				className="space-y-6"
			>
				<div className="space-y-4">
					<p className="text-sm text-slate-500 leading-relaxed">
						Choose how to calculate your monthly lifestyle targets.
					</p>

					<div className="space-y-3">
						<button
							type="button"
							onClick={() => setIncomeSource("default_wallet")}
							className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${incomeSource === "default_wallet" ? "border-royal bg-royal/5" : "border-slate-100 hover:border-slate-200"}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="font-bold text-slate-800">
									Default Wallet Salary
								</span>
								{incomeSource === "default_wallet" && (
									<ShieldCheck className="w-5 h-5 text-royal" />
								)}
							</div>
							<div className="text-xs text-slate-500">
								Use the monthly income set on your default wallet.
								{defaultWallet ? (
									<span className="block mt-1 font-bold text-royal">
										Current:{" "}
										{formatCurrency(defaultWallet.monthlyIncome || 0, currency)}{" "}
										({defaultWallet.name})
									</span>
								) : (
									<span className="block mt-1 font-bold text-rose-500">
										No default wallet set.
									</span>
								)}
							</div>
						</button>

						<button
							type="button"
							onClick={() => setIncomeSource("custom")}
							className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${incomeSource === "custom" ? "border-royal bg-royal/5" : "border-slate-100 hover:border-slate-200"}`}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="font-bold text-slate-800">
									Custom Monthly Budget
								</span>
								{incomeSource === "custom" && (
									<ShieldCheck className="w-5 h-5 text-royal" />
								)}
							</div>
							<p className="text-xs text-slate-500">
								Manually set a target monthly income for your lifestyle.
							</p>
						</button>
					</div>

					{incomeSource === "custom" && (
						<div className="pt-2 animate-in fade-in slide-in-from-top-2">
							<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
								Monthly Budget Amount
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">
									{getCurrencySymbol(currency)}
								</span>
								<input
									type="number"
									placeholder="0.00"
									value={customIncomeAmount}
									onChange={(e) => setCustomIncomeAmount(e.target.value)}
									className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-all"
									required
								/>
							</div>
						</div>
					)}

					<div className="pt-4 border-t border-slate-100">
						<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
							Allocation Percentages (%)
						</label>
						<div className="grid grid-cols-3 gap-3">
							<div>
								<label className="block text-[10px] font-medium text-slate-500 mb-1">
									Needs
								</label>
								<input
									type="number"
									value={percentages.need}
									onChange={(e) =>
										setPercentages({
											...percentages,
											need: Number(e.target.value),
										})
									}
									className="w-full min-w-0 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-royal/50"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-medium text-slate-500 mb-1">
									Wants
								</label>
								<input
									type="number"
									value={percentages.want}
									onChange={(e) =>
										setPercentages({
											...percentages,
											want: Number(e.target.value),
										})
									}
									className="w-full min-w-0 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-notion-blue/50"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-medium text-slate-500 mb-1">
									Savings
								</label>
								<input
									type="number"
									value={percentages.savings}
									onChange={(e) =>
										setPercentages({
											...percentages,
											savings: Number(e.target.value),
										})
									}
									className="w-full min-w-0 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-emerald-500/50"
								/>
							</div>
						</div>
						<div className="mt-3 flex justify-between items-center">
							<p className="text-[10px] text-slate-400">Total must be 100%</p>
							<p
								className={`text-xs font-bold ${percentages.need + percentages.want + percentages.savings === 100 ? "text-emerald-600" : "text-rose-500"}`}
							>
								Current Total:{" "}
								{percentages.need + percentages.want + percentages.savings}%
							</p>
						</div>
					</div>
				</div>
			</form>
		</Modal>
	);
}

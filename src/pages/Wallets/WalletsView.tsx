import { addDays, differenceInDays, format, parseISO } from "date-fns";
import {
	ArrowLeft,
	Calendar,
	ChevronDown,
	ChevronRight,
	PiggyBank,
	Target,
	Trash2,
	TrendingUp,
	Wallet as WalletIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { FloatingAddButton } from "../../components/FloatingAddButton";
import { formatCurrency, getCurrencySymbol } from "../../lib/utils";
import type { Wallet } from "../../types";
import { WalletModal } from "./components/WalletModal";
import type { WalletsViewProps } from "./types";

export function WalletsView({
	transactions,
	recurringTransactions,
	wallets,
	currency,
	onAddWallet,
	onUpdateWallet,
	onDeleteWallet,
	onAddRecurringTransaction,
	onUpdateRecurringTransaction,
	onDeleteRecurringTransaction,
}: WalletsViewProps) {
	const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [balance, setBalance] = useState("");
	const [monthlyIncome, setMonthlyIncome] = useState("");
	const [type, setType] = useState<"normal" | "savings">("normal");
	const [isDefault, setIsDefault] = useState(false);
	const [savingsGoal, setSavingsGoal] = useState("");
	const [savingsEndDate, setSavingsEndDate] = useState("");
	const [budgetOverviewExpanded, setBudgetOverviewExpanded] = useState(false);

	// Sync form state when a wallet is selected for inline editing
	React.useEffect(() => {
		const selected = wallets.find((w) => w.id === selectedWalletId);
		if (selected) {
			setName(selected.name);
			setBalance(selected.balance.toString());
			setMonthlyIncome(selected.monthlyIncome?.toString() || "");
			setType(selected.type || "normal");
			setIsDefault(!!selected.isDefault);
			setSavingsGoal(selected.savingsGoal?.toString() || "");
			setSavingsEndDate(selected.savingsEndDate || "");
		}
	}, [selectedWalletId, wallets]);

	React.useEffect(() => {
		setBudgetOverviewExpanded(false);
	}, [selectedWalletId]);

	const calculateWalletDailyRate = (walletId: string) => {
		const walletTransactions = transactions.filter(
			(t) => t.walletId === walletId,
		);
		if (walletTransactions.length === 0) return 0;

		const sortedDates = walletTransactions
			.map((t) => parseISO(t.date).getTime())
			.sort((a, b) => a - b);
		const firstDate = new Date(sortedDates[0]);
		const today = new Date();
		const daysTracked = Math.max(1, differenceInDays(today, firstDate));

		const totalIncome = walletTransactions
			.filter((t) => t.type === "income")
			.reduce((acc, t) => acc + t.amount, 0);
		const totalExpense = walletTransactions
			.filter((t) => t.type === "expense")
			.reduce((acc, t) => acc + t.amount, 0);
		const netSaved = totalIncome - totalExpense;

		return Math.max(0, netSaved / daysTracked);
	};

	const handleOpenAdd = () => {
		setEditingWallet(null);
		setName("");
		setBalance("");
		setMonthlyIncome("");
		setType("normal");
		setIsDefault(wallets.length === 0);
		setSavingsGoal("");
		setSavingsEndDate("");
		setIsModalOpen(true);
	};

	const handleSubmit = (
		e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>,
	) => {
		e?.preventDefault();
		if (!name.trim() || (balance !== "" && Number.isNaN(Number(balance))))
			return;

		const walletData: Wallet = {
			id: editingWallet?.id || selectedWalletId || crypto.randomUUID(),
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

		if (editingWallet || selectedWalletId) {
			onUpdateWallet(walletData);
		} else {
			onAddWallet(walletData);
		}
		setIsModalOpen(false);
		setSelectedWalletId(null);
	};

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this wallet?")) {
			const existingSalary = recurringTransactions.find(
				(r) =>
					r.walletId === id &&
					r.description === "Salary" &&
					r.type === "income",
			);
			if (existingSalary) {
				onDeleteRecurringTransaction(existingSalary.id);
			}
			onDeleteWallet(id);
			setIsModalOpen(false);
			if (selectedWalletId === id) setSelectedWalletId(null);
		}
	};

	const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
	const sortedWallets = [...wallets].sort((a, b) => {
		if (a.isDefault) return -1;
		if (b.isDefault) return 1;
		return 0;
	});

	if (selectedWallet) {
		const currencyLabel = getCurrencySymbol(currency);
		const isSavings = selectedWallet.type === "savings";
		const dailyRate = calculateWalletDailyRate(selectedWallet.id);
		const target = Number(savingsGoal) || 0;
		const amountNeeded = Math.max(0, target - selectedWallet.balance);

		let daysRequired = 0;
		let estimatedDate = null;
		if (target > 0 && amountNeeded > 0 && dailyRate > 0) {
			daysRequired = Math.ceil(amountNeeded / dailyRate);
			estimatedDate = addDays(new Date(), daysRequired);
		}

		const isDefaultWallet = selectedWallet.isDefault;
		const monthlyIncomeValue = selectedWallet.monthlyIncome || 0;
		const fixedCosts = recurringTransactions
			.filter(
				(r) =>
					r.isActive &&
					r.isFixedCost &&
					r.type === "expense" &&
					r.walletId === selectedWallet.id,
			)
			.reduce((acc, r) => {
				// Normalize to monthly
				const monthlyAmount =
					r.recurrence === "weekly" ? r.amount * 4.33 : r.amount;
				return acc + monthlyAmount;
			}, 0);
		const netMonthlyIncome = monthlyIncomeValue - fixedCosts;
		const netWeeklyBudget = netMonthlyIncome / 4.33;

		return (
			<div className="relative -mx-4 flex min-h-[calc(100dvh-9rem)] flex-col animate-in fade-in slide-in-from-right-4 duration-300">
				<div className="flex-1 space-y-6 px-4 pb-4">
					<button
						type="button"
						onClick={() => setSelectedWalletId(null)}
						className="flex items-center text-slate-500 hover:text-royal transition-colors"
					>
						<ArrowLeft className="mr-1 h-5 w-5" /> Back to Wallets
					</button>

					{isDefaultWallet && type === "normal" && (
						<div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
							<h3 className="flex items-center text-sm font-bold uppercase tracking-widest text-slate-800">
								<Target className="mr-2 h-4 w-4 text-royal" /> Budget
								Overview
							</h3>

							<button
								type="button"
								onClick={() => setBudgetOverviewExpanded((e) => !e)}
								aria-expanded={budgetOverviewExpanded}
								className="w-full rounded-2xl border border-royal/10 bg-royal/5 p-5 text-left transition-colors hover:bg-royal/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal/40"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="mb-2 flex items-center text-royal">
											<span className="text-xs font-bold uppercase tracking-widest">
												Weekly Budget
											</span>
										</div>
										<p className="font-mono text-2xl font-bold text-royal-dark">
											{formatCurrency(netWeeklyBudget, currency)}
										</p>
									</div>
									<ChevronDown
										className={`mt-1 h-5 w-5 shrink-0 text-royal transition-transform ${budgetOverviewExpanded ? "rotate-180" : ""}`}
										aria-hidden
									/>
								</div>
							</button>

							{budgetOverviewExpanded && (
								<div className="grid animate-in fade-in slide-in-from-top-2 grid-cols-1 gap-4 border-t border-slate-100 pt-4 duration-200 sm:grid-cols-2">
									<div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
										<div className="mb-2 flex items-center text-rose-500">
											<span className="text-xs font-bold uppercase tracking-widest">
												Fixed Costs
											</span>
										</div>
										<p className="font-mono text-2xl font-bold text-rose-600">
											-{formatCurrency(fixedCosts, currency)}
										</p>
									</div>
									<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
										<div className="mb-2 flex items-center text-emerald-600">
											<span className="text-xs font-bold uppercase tracking-widest">
												Net Monthly
											</span>
										</div>
										<p className="font-mono text-2xl font-bold text-emerald-700">
											{formatCurrency(netMonthlyIncome, currency)}
										</p>
									</div>
								</div>
							)}
						</div>
					)}

				<div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
								Wallet Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-all font-medium"
							/>
						</div>

						<div>
							<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
								Current Balance
							</label>
							<div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 pl-4 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-royal/50">
								<span className="shrink-0 text-xl font-medium text-slate-400 tabular-nums">
									{currencyLabel}
								</span>
								<input
									type="number"
									step="0.01"
									value={balance}
									onChange={(e) => setBalance(e.target.value)}
									className="min-w-0 flex-1 border-0 bg-transparent py-4 pr-4 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-0"
								/>
							</div>
						</div>

						{type === "normal" && (
							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
									Monthly Income
								</label>
								<div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 pl-4 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-royal/50">
									<span className="shrink-0 text-xl font-medium text-slate-400 tabular-nums">
										{currencyLabel}
									</span>
									<input
										type="number"
										step="0.01"
										value={monthlyIncome}
										onChange={(e) => setMonthlyIncome(e.target.value)}
										className="min-w-0 flex-1 border-0 bg-transparent py-4 pr-4 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-0"
									/>
								</div>
							</div>
						)}

						{type === "savings" && (
							<>
								<div>
									<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
										Savings Goal (Optional)
									</label>
									<div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 pl-4 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-royal/50">
										<span className="shrink-0 text-xl font-medium text-slate-400 tabular-nums">
											{currencyLabel}
										</span>
										<input
											type="number"
											step="0.01"
											value={savingsGoal}
											onChange={(e) => setSavingsGoal(e.target.value)}
											className="min-w-0 flex-1 border-0 bg-transparent py-4 pr-4 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-0"
										/>
									</div>
								</div>
								<div>
									<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
										Target Date (Optional)
									</label>
									<input
										type="date"
										value={savingsEndDate}
										onChange={(e) => setSavingsEndDate(e.target.value)}
										className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-all font-medium"
									/>
								</div>
							</>
						)}

						{type === "normal" && (
							<div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 self-end h-[74px]">
								<input
									type="checkbox"
									id="isDefaultInline"
									checked={isDefault}
									onChange={(e) => setIsDefault(e.target.checked)}
									className="w-5 h-5 rounded border-slate-300 text-royal focus:ring-royal"
								/>
								<label
									htmlFor="isDefaultInline"
									className="text-sm font-bold text-slate-700 cursor-pointer"
								>
									Set as Default Wallet
								</label>
							</div>
						)}
					</div>
				</div>

				{isSavings && target > 0 && (
					<div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
							<Target className="w-4 h-4 mr-2 text-emerald-500" /> Savings
							Projections
						</h3>

						<div className="animate-in fade-in slide-in-from-top-2 duration-300">
							{amountNeeded === 0 ? (
								<div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex items-center border border-emerald-100">
									<span className="text-3xl mr-4">🎉</span>
									<div>
										<p className="font-bold">Goal Reached!</p>
										<p className="text-sm opacity-90">
											You have successfully saved enough in this wallet.
										</p>
									</div>
								</div>
							) : dailyRate <= 0 ? (
								<div className="bg-amber-50 text-amber-700 p-6 rounded-2xl text-sm border border-amber-100">
									<p className="font-medium">
										No positive savings rate detected.
									</p>
									<p className="opacity-90 mt-1">
										Add more income transactions to this wallet to see a
										projection of when you'll reach your goal.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
										<div className="flex items-center text-emerald-600 mb-2">
											<TrendingUp className="w-4 h-4 mr-2" />
											<span className="text-xs font-bold uppercase tracking-widest">
												Daily Savings Rate
											</span>
										</div>
										<p className="text-2xl font-mono font-bold text-emerald-700">
											+{formatCurrency(dailyRate, currency)}
										</p>
									</div>
									<div className="bg-royal/5 p-5 rounded-2xl border border-royal/10">
										<div className="flex items-center text-royal mb-2">
											<Calendar className="w-4 h-4 mr-2" />
											<span className="text-xs font-bold uppercase tracking-widest">
												Estimated Goal Date
											</span>
										</div>
										<p className="text-2xl font-bold text-royal-dark">
											{estimatedDate
												? format(estimatedDate, "MMM d, yyyy")
												: "---"}
										</p>
										<p className="text-xs text-slate-500 mt-1 font-medium">
											{daysRequired} days remaining
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

					<button
						type="button"
						onClick={() => handleDelete(selectedWallet.id)}
						className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-4 text-sm font-bold uppercase tracking-widest text-rose-600 transition-colors hover:bg-rose-100"
					>
						<Trash2 className="h-5 w-5 shrink-0" />
						Delete Wallet
					</button>
				</div>

				<div className="sticky bottom-0 z-20 mt-auto bg-transparent px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
					<button
						type="button"
						onClick={handleSubmit}
						disabled={
							!name.trim() ||
							(balance !== "" && Number.isNaN(Number(balance)))
						}
						className="w-full rounded-2xl bg-royal py-4 text-center text-sm font-bold text-white shadow-lg shadow-royal/20 transition-all hover:bg-royal-dark active:scale-[0.98] disabled:opacity-50"
					>
						Save
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-20">
			<div className="bg-royal text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
				<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
				<h2 className="text-xl font-bold mb-1 relative z-10">My Wallets</h2>
				<p className="text-royal-light text-sm relative z-10">
					Manage your accounts and track savings goals.
				</p>
				<div className="mt-6 pt-6 border-t border-white/10 relative z-10 grid grid-cols-2 gap-4">
					<div>
						<p className="text-[10px] uppercase tracking-widest font-bold text-royal-light mb-1">
							Balance
						</p>
						<p className="text-2xl font-light">
							{formatCurrency(
								(wallets || [])
									.filter((w) => w.type !== "savings")
									.reduce((acc, w) => acc + w.balance, 0),
								currency,
							)}
						</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-widest font-bold text-royal-light mb-1">
							Total Savings
						</p>
						<p className="text-2xl font-light">
							{formatCurrency(
								(wallets || [])
									.filter((w) => w.type === "savings")
									.reduce((acc, w) => acc + w.balance, 0),
								currency,
							)}
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{sortedWallets.map((wallet) => {
					const isSavings = wallet.type === "savings";
					return (
						<div
							key={wallet.id}
							onClick={() => setSelectedWalletId(wallet.id)}
							className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-royal/30 transition-all cursor-pointer active:scale-[0.98]"
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<div
										className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isSavings ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}
									>
										{isSavings ? (
											<PiggyBank className="w-6 h-6" />
										) : (
											<WalletIcon className="w-6 h-6" />
										)}
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-bold text-slate-800">
												{wallet.name}
											</h3>
											{wallet.isDefault && (
												<span className="bg-royal/10 text-royal text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
													Default
												</span>
											)}
										</div>
										<p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
											{isSavings ? "Savings Account" : "Normal Account"}
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<div className="text-right">
										<p className="font-mono font-bold text-slate-800">
											{formatCurrency(wallet.balance, currency)}
										</p>
									</div>
									<ChevronRight className="w-5 h-5 text-slate-300" />
								</div>
							</div>

							{isSavings && wallet.savingsGoal ? (
								<div className="mt-4 pt-4 border-t border-slate-50">
									<div className="flex justify-between items-end mb-1.5">
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
											Goal Progress
										</p>
										<p className="text-xs font-bold text-notion-green">
											{Math.round(
												Math.min(
													100,
													(wallet.balance / wallet.savingsGoal) * 100,
												),
											)}
											%
										</p>
									</div>
									<div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-notion-green transition-all duration-500"
											style={{
												width: `${Math.min(100, (wallet.balance / wallet.savingsGoal) * 100)}%`,
											}}
										></div>
									</div>
									<div className="flex justify-between mt-2">
										<p className="text-[10px] text-slate-400 font-medium">
											Target: {formatCurrency(wallet.savingsGoal, currency)}
										</p>
										{wallet.savingsEndDate && (
											<p className="text-[10px] text-slate-400 font-medium">
												By{" "}
												{format(parseISO(wallet.savingsEndDate), "MMM d, yyyy")}
											</p>
										)}
									</div>
								</div>
							) : null}
						</div>
					);
				})}
			</div>

			<FloatingAddButton
				onClick={handleOpenAdd}
				aria-label="Add wallet"
			/>

			<AnimatePresence>
				{isModalOpen && (
					<WalletModal
						isOpen={isModalOpen}
						onClose={() => {
							setIsModalOpen(false);
							setEditingWallet(null);
						}}
						onAddWallet={(w) => {
							onAddWallet(w);
						}}
						onUpdateWallet={(w) => {
							onUpdateWallet(w);
						}}
						onDeleteWallet={(id) => {
							const existingSalary = recurringTransactions.find(
								(r) =>
									r.walletId === id &&
									r.description === "Salary" &&
									r.type === "income",
							);
							if (existingSalary) {
								onDeleteRecurringTransaction(existingSalary.id);
							}
							onDeleteWallet(id);
						}}
						onAddRecurringTransaction={onAddRecurringTransaction}
						onUpdateRecurringTransaction={onUpdateRecurringTransaction}
						onDeleteRecurringTransaction={onDeleteRecurringTransaction}
						editingWallet={editingWallet}
						currency={currency}
						isFirstWallet={wallets.length === 0}
						recurringTransactions={recurringTransactions}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

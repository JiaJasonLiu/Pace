import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RefreshCw, Trash2, Wallet as WalletIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { getCurrencySymbol } from "../lib/utils";
import type { RecurrenceType } from "../types";
import { CategorySheet } from "./CategorySheet";
import { Modal } from "./Modal";
import { SheetSelect, type SheetSelectOption } from "./SheetSelect";
import type { TransactionModalProps } from "./types";
import { useTransactionForm } from "../hooks/useTransactionForm";

export function TransactionModal({
	isOpen,
	onClose,
	onSave,
	onDelete,
	initialData,
	categories,
	wallets,
	currency,
	title,
}: TransactionModalProps) {
	const {
		displayAmount,
		type,
		category,
		setCategory,
		description,
		setDescription,
		date,
		setDate,
		walletId,
		setWalletId,
		recurrence,
		setRecurrence,
		status,
		setStatus,
		isFixedCost,
		setIsFixedCost,
		isFutureDate,
		expenseCategories,
		incomeCategories,
		amountInputRef,
		handleTypeChange,
		handleAmountChange,
		handleSubmit,
	} = useTransactionForm({ isOpen, onClose, onSave, initialData, categories, wallets });

	const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
	const toggleId = useId();

	const walletOptions: SheetSelectOption[] = useMemo(
		() => [
			{ value: "", label: "Select a wallet", disabled: true },
			...wallets.map((w) => ({ value: w.id, label: w.name })),
		],
		[wallets],
	);

	const recurrenceOptions: SheetSelectOption[] = useMemo(
		() => [
			{ value: "none", label: "One-time" },
			{ value: "weekly", label: "Every Week" },
			{ value: "monthly", label: "Every Month" },
		],
		[],
	);

	const currentCategories =
		type === "expense" ? expenseCategories : incomeCategories;

	const selectedCat = currentCategories.find((c) => c.name === category);

	const fieldRowClass =
		"flex h-14 shrink-0 items-center gap-4 border-b border-slate-100 px-4 hover:bg-slate-50 transition-colors";
	const fieldRowLabelClass = `${fieldRowClass} cursor-pointer`;

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title={title}
				footer={
					<div className="flex items-center gap-2">
						{onDelete && (
							<button
								type="button"
								onClick={onDelete}
								className="p-4 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors flex-shrink-0"
								title="Delete Transaction"
							>
								<Trash2 className="w-5 h-5" />
							</button>
						)}
						<button
							type="submit"
							form="transaction-form"
							className="flex-1 py-4 bg-royal text-white rounded-xl font-bold shadow-md shadow-royal/20 hover:bg-royal-dark transition-all active:scale-[0.98] text-sm"
						>
							Save
						</button>
					</div>
				}
			>
				<form id="transaction-form" onSubmit={handleSubmit} className="space-y-3">
					{/* Amount with currency prefix — grows with content */}
					<div className="flex items-baseline justify-center gap-0.5 py-2">
						<span className="text-4xl font-bold text-slate-800 select-none">
							{getCurrencySymbol(currency)}
						</span>
						<input
							ref={amountInputRef}
							type="text"
							inputMode="decimal"
							placeholder="0.00"
							// biome-ignore lint/a11y/noAutofocus: intentional — opens keyboard on iOS PWA
							autoFocus
							value={displayAmount}
							onChange={(e) => handleAmountChange(e.target.value)}
							style={{ fieldSizing: "content" } as React.CSSProperties}
							className="bg-transparent text-4xl font-bold text-slate-800 focus:outline-none min-w-[3ch]"
							required
						/>
					</div>

					<div className="flex rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
						<button
							type="button"
							onClick={() => handleTypeChange("expense")}
							className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
						>
							Expense
						</button>
						<button
							type="button"
							onClick={() => handleTypeChange("income")}
							className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "income" ? "bg-white text-notion-green shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
						>
							Income
						</button>
					</div>

					<hr className="border-slate-100" />

					<div className="flex flex-col">
						{/* 1. Wallet */}
						<div className={fieldRowClass}>
							<WalletIcon className="w-5 h-5 shrink-0 text-slate-400" />
							<SheetSelect
								value={walletId}
								onChange={setWalletId}
								options={walletOptions}
								placeholder="Select a wallet"
								className="min-w-0 flex-1"
								aria-label="Wallet"
							/>
						</div>

						{/* 2. Notes — second so keyboard doesn't obscure it */}
						<label className={fieldRowLabelClass}>
							<Icons.AlignLeft className="h-5 w-5 shrink-0 text-slate-400" />
							<input
								type="text"
								placeholder="Notes"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none truncate"
							/>
						</label>

						{/* 3. Date */}
						<label className={fieldRowLabelClass}>
							<Icons.Calendar className="h-5 w-5 shrink-0 text-slate-400" />
							<input
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
								required
							/>
						</label>

						{/* 4. Category — custom bottom sheet */}
						<button
							type="button"
							onClick={() => setIsCategorySheetOpen(true)}
							className={`${fieldRowClass} w-full text-left`}
						>
							{(() => {
								const IconComponent = selectedCat
									? (Icons as unknown as Record<string, LucideIcon>)[
											selectedCat.icon
										] || Icons.HelpCircle
									: Icons.Tag;
								return (
									<IconComponent className="w-5 h-5 shrink-0 text-slate-400" />
								);
							})()}
							<span
								className={`flex-1 text-sm truncate ${category ? "text-slate-700" : "text-slate-400"}`}
							>
								{category || "Select category"}
							</span>
							<Icons.ChevronRight className="w-4 h-4 shrink-0 text-slate-300" />
						</button>

						{/* 5. Status (future dates only) */}
						{isFutureDate && (
							<label className={fieldRowLabelClass}>
								<Icons.Clock className="h-5 w-5 shrink-0 text-slate-400" />
								<div className="flex min-h-0 min-w-0 flex-1 items-center justify-between">
									<span className="text-slate-700 text-sm">Status</span>
									<button
										type="button"
										onClick={() =>
											setStatus(status === "posted" ? "scheduled" : "posted")
										}
										className={`text-xs font-bold px-3 py-1 rounded-full transition-all border shadow-sm ${
											status === "posted"
												? "text-notion-green border-notion-green-light bg-white"
												: "text-amber-600 border-amber-200 bg-white"
										}`}
									>
										{status === "posted" ? "Posted" : "Scheduled"}
									</button>
								</div>
							</label>
						)}

						{/* 6. Recurrence */}
						<div className={fieldRowClass}>
							<RefreshCw className="w-5 h-5 shrink-0 text-slate-400" />
							<SheetSelect
								value={recurrence}
								onChange={(v) => setRecurrence(v as RecurrenceType | "none")}
								options={recurrenceOptions}
								placeholder="Recurrence"
								className="min-w-0 flex-1"
								aria-label="Recurrence"
							/>
						</div>

						{/* 7. Fixed Cost */}
						{recurrence !== "none" && type === "expense" && (
							<label className={`${fieldRowLabelClass} justify-between`}>
								<div className="flex min-w-0 items-center gap-4">
									<Icons.Lock className="h-5 w-5 shrink-0 text-slate-400" />
									<span className="text-sm text-slate-700">Fixed Cost</span>
								</div>
								<div className="relative mr-2 inline-block w-10 shrink-0 select-none align-middle transition duration-200 ease-in">
									<input
										type="checkbox"
										name="toggle"
										id={toggleId}
										checked={isFixedCost}
										onChange={(e) => setIsFixedCost(e.target.checked)}
										className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
										style={{
											right: isFixedCost ? "0" : "1.25rem",
											borderColor: isFixedCost ? "#4F46E5" : "#CBD5E1",
											transition: "all 0.2s ease",
										}}
									/>
									<label
										htmlFor={toggleId}
										className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
										style={{
											backgroundColor: isFixedCost ? "#4F46E5" : "#CBD5E1",
											transition: "all 0.2s ease",
										}}
									/>
								</div>
							</label>
						)}
					</div>
				</form>
			</Modal>

			<CategorySheet
				isOpen={isCategorySheetOpen}
				onClose={() => setIsCategorySheetOpen(false)}
				categories={currentCategories}
				value={category}
				onChange={setCategory}
			/>
		</>
	);
}

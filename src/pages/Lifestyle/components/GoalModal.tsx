import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AlignLeft } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/Modal";
import { getCurrencySymbol } from "../../../lib/utils";
import { SheetSelect, type SheetSelectOption } from "../../../components/SheetSelect";
import type { GoalModalProps } from "../types";

export function GoalModal({
	isOpen,
	onClose,
	onAddGoal,
	onUpdateGoal,
	editingGoal,
	currency,
	selectedCategory,
	categories,
}: GoalModalProps) {
	const [title, setTitle] = useState("");
	const [targetAmount, setTargetAmount] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<"need" | "want" | "savings">("need");

	const filteredCategories = useMemo(
		() =>
			categories.filter(
				(c) =>
					c.lifestyleType === category &&
					(category === "savings" ? c.type === "income" : c.type === "expense"),
			),
		[categories, category],
	);

	const categoryOptions: SheetSelectOption[] = useMemo(
		() =>
			filteredCategories.map((cat) => ({
				value: cat.name,
				label: cat.name,
			})),
		[filteredCategories],
	);

	const fieldRowClass =
		"flex h-14 shrink-0 items-center gap-4 border-b border-slate-100 px-4 hover:bg-slate-50 transition-colors";

	useEffect(() => {
		if (editingGoal) {
			setTitle(editingGoal.title);
			setTargetAmount(editingGoal.targetAmount.toString());
			setDescription(editingGoal.description);
			setCategory(editingGoal.category);
		} else {
			const initialCategory = selectedCategory || "need";
			setCategory(initialCategory);

			const initialFilteredCats = categories.filter(
				(c) =>
					c.lifestyleType === initialCategory &&
					(initialCategory === "savings"
						? c.type === "income"
						: c.type === "expense"),
			);
			setTitle(initialFilteredCats[0]?.name || "");
			setTargetAmount("");
			setDescription("");
		}
	}, [editingGoal, selectedCategory, categories]);

	const handleCategoryTypeChange = (cat: "need" | "want" | "savings") => {
		setCategory(cat);
		const newFilteredCats = categories.filter(
			(c) =>
				c.lifestyleType === cat &&
				(cat === "savings" ? c.type === "income" : c.type === "expense"),
		);
		setTitle(newFilteredCats[0]?.name || "");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !targetAmount || Number.isNaN(Number(targetAmount))) return;

		const goalData = {
			title,
			targetAmount: Number(targetAmount),
			currentAmount: 0,
			description,
			category,
		};

		if (editingGoal) {
			onUpdateGoal({ ...editingGoal, ...goalData });
		} else {
			onAddGoal({ id: crypto.randomUUID(), ...goalData });
		}

		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={editingGoal ? "Edit Lifestyle Goal" : "Add Lifestyle Goal"}
			footer={
				<button
					type="submit"
					form="lifestyle-goal-form"
					className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] text-sm"
				>
					{editingGoal ? "Save Changes" : "Add to Blueprint"}
				</button>
			}
		>
			<form
				id="lifestyle-goal-form"
				onSubmit={handleSubmit}
				className="space-y-3"
			>
				<div className="flex items-baseline justify-center gap-0.5 py-2">
					<span className="text-4xl font-bold text-slate-800 select-none">
						{getCurrencySymbol(currency)}
					</span>
					<input
						type="text"
						inputMode="decimal"
						placeholder="0.00"
						value={targetAmount}
						onChange={(e) => setTargetAmount(e.target.value)}
						style={{ fieldSizing: "content" } as React.CSSProperties}
						className="bg-transparent text-4xl font-bold text-slate-800 focus:outline-none min-w-[3ch]"
						required
					/>
				</div>
				<p className="text-center text-xs text-slate-400 font-medium -mt-2 mb-4">
					Monthly Target
				</p>

				<div className="flex rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
					{(["need", "want", "savings"] as const).map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => handleCategoryTypeChange(cat)}
							className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${category === cat ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
						>
							{cat}
						</button>
					))}
				</div>

				<hr className="border-slate-100" />

				<div className="flex flex-col">
					<div className={fieldRowClass}>
						{(() => {
							const selectedCat = filteredCategories.find(
								(c) => c.name === title,
							);
							const IconComponent = selectedCat
								? (Icons as unknown as Record<string, LucideIcon>)[
										selectedCat.icon
									] || Icons.HelpCircle
								: Icons.Tag;
							return (
								<IconComponent className="w-5 h-5 shrink-0 text-slate-400" />
							);
						})()}
						<SheetSelect
							value={title}
							onChange={setTitle}
							options={categoryOptions}
							placeholder="Select category"
							className="min-w-0 flex-1"
							aria-label="Category"
						/>
					</div>

					<label className="flex items-center gap-4 p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
						<AlignLeft className="w-5 h-5 text-slate-400" />
						<input
							type="text"
							placeholder="Motivation / Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="flex-1 bg-transparent focus:outline-none text-slate-700 text-sm placeholder:text-slate-400 truncate"
						/>
					</label>
				</div>
			</form>
		</Modal>
	);
}

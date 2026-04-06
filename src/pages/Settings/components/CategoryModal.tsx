import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/Modal";
import { SheetSelect, type SheetSelectOption } from "../../../components/SheetSelect";
import type { Category, TransactionType } from "../../../types";
import type { CategoryModalProps } from "../types";

const AVAILABLE_ICONS = [
	"Utensils",
	"Car",
	"Home",
	"Film",
	"ShoppingBag",
	"Zap",
	"HeartPulse",
	"Briefcase",
	"Laptop",
	"TrendingUp",
	"Gift",
	"MoreHorizontal",
	"Coffee",
	"Plane",
	"Smartphone",
	"Wifi",
	"Book",
	"Music",
	"Camera",
	"Smile",
];

export function CategoryModal({
	isOpen,
	onClose,
	onSave,
	onDelete,
	editingCategory,
	categories,
}: CategoryModalProps) {
	const [name, setName] = useState("");
	const [type, setType] = useState<TransactionType>("expense");
	const [icon, setIcon] = useState("MoreHorizontal");
	const [lifestyleType, setLifestyleType] = useState<
		"need" | "want" | "savings" | "income" | "none"
	>("need");
	const [mainCategoryId, setMainCategoryId] = useState("");

	useEffect(() => {
		if (editingCategory) {
			setName(editingCategory.name);
			setType(editingCategory.type);
			setIcon(editingCategory.icon);
			setLifestyleType(
				editingCategory.lifestyleType ||
					(editingCategory.type === "income" ? "income" : "need"),
			);
			setMainCategoryId(editingCategory.mainCategoryId || "");
		} else {
			setName("");
			setType("expense");
			setIcon("MoreHorizontal");
			setLifestyleType("need");
			setMainCategoryId("");
		}
	}, [editingCategory]);

	const mainCategoryCandidates = useMemo(
		() =>
			(categories || []).filter(
				(c) =>
					!c.mainCategoryId &&
					c.id !== editingCategory?.id &&
					c.type === type,
			),
		[categories, editingCategory?.id, type],
	);

	const mainCategoryOptions: SheetSelectOption[] = useMemo(
		() => [
			{ value: "", label: "None (Top Level)" },
			...mainCategoryCandidates.map((c) => ({
				value: c.id,
				label: c.name,
			})),
		],
		[mainCategoryCandidates],
	);

	const mainCategorySelectDisabled =
		!!editingCategory &&
		(categories || []).some((c) => c.mainCategoryId === editingCategory.id);

	const handleMainCategoryChange = (newMainId: string) => {
		setMainCategoryId(newMainId);
		if (newMainId) {
			const mainCat = (categories || []).find((c) => c.id === newMainId);
			if (mainCat?.lifestyleType) {
				setLifestyleType(mainCat.lifestyleType);
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		const categoryData: Category = {
			id: editingCategory?.id || crypto.randomUUID(),
			name: name.trim(),
			type,
			icon,
			lifestyleType,
			mainCategoryId: mainCategoryId || undefined,
		};

		onSave(categoryData);
	};

	const renderIcon = (iconName: string) => {
		const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
		return <IconComponent className="w-5 h-5" />;
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={editingCategory ? "Edit Category" : "New Category"}
			footer={
				<button
					type="submit"
					form="category-form"
					className="w-full py-4 bg-royal text-white rounded-xl font-medium shadow-md shadow-royal/20 hover:bg-royal-dark transition-colors active:scale-[0.98]"
				>
					{editingCategory ? "Update Category" : "Save Category"}
				</button>
			}
			actions={
				editingCategory &&
				onDelete && (
					<button
						type="button"
						onClick={() => onDelete(editingCategory.id)}
						className="text-rose-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				)
			}
		>
			<form id="category-form" onSubmit={handleSubmit} className="space-y-5">
				<div className="flex rounded-lg overflow-hidden border border-slate-200 p-1 bg-slate-50">
					<button
						type="button"
						onClick={() => {
							setType("expense");
							setMainCategoryId("");
						}}
						className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						Expense
					</button>
					<button
						type="button"
						onClick={() => {
							setType("income");
							setMainCategoryId("");
						}}
						className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						Income
					</button>
				</div>

				<div className="space-y-2">
					<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Lifestyle Bucket
					</label>
					<div className="flex rounded-lg overflow-hidden border border-slate-200 p-1 bg-slate-50">
						{type === "expense"
							? (["need", "want", "savings"] as const).map((lType) => (
									<button
										key={lType}
										type="button"
										onClick={() => setLifestyleType(lType)}
										disabled={!!mainCategoryId}
										className={`flex-1 py-2 text-xs font-bold rounded-md transition-all capitalize ${lifestyleType === lType ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
									>
										{lType}
									</button>
								))
							: (["income", "savings", "none"] as const).map((lType) => (
									<button
										key={lType}
										type="button"
										onClick={() => setLifestyleType(lType)}
										disabled={!!mainCategoryId}
										className={`flex-1 py-2 text-xs font-bold rounded-md transition-all capitalize ${lifestyleType === lType ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
									>
										{lType}
									</button>
								))}
					</div>
					{mainCategoryId && (
						<p className="text-[10px] text-royal italic">
							Inherited from main category
						</p>
					)}
					{!mainCategoryId && (
						<p className="text-[10px] text-slate-400 italic">
							{type === "expense" ? (
								<>
									{lifestyleType === "need" &&
										"Essential expenses (Housing, Food, Bills)"}
									{lifestyleType === "want" &&
										"Discretionary spending (Dining out, Hobbies)"}
									{lifestyleType === "savings" &&
										"Money set aside for future goals"}
								</>
							) : (
								<>
									{lifestyleType === "income" &&
										"Regular income (Salary, Freelance)"}
									{lifestyleType === "savings" &&
										"Income that goes directly to savings (Interest)"}
									{lifestyleType === "none" &&
										"Income not tracked in lifestyle blueprint"}
								</>
							)}
						</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
							Name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-colors"
							required
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
							Main Category
						</label>
						<div className="rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-royal/50">
							<SheetSelect
								value={mainCategoryId}
								onChange={handleMainCategoryChange}
								options={mainCategoryOptions}
								placeholder="None (Top Level)"
								disabled={mainCategorySelectDisabled}
								className="w-full h-auto! min-h-0 px-3 py-3 bg-transparent rounded-xl text-sm focus-visible:ring-0"
								aria-label="Main category"
							/>
						</div>
						{editingCategory && mainCategorySelectDisabled && (
							<p className="text-[10px] text-rose-500 mt-1">
								Cannot be a subcategory because it has subcategories.
							</p>
						)}
					</div>
				</div>

				<div>
					<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
						Icon
					</label>
					<div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
						{AVAILABLE_ICONS.map((iconName) => (
							<button
								key={iconName}
								type="button"
								onClick={() => setIcon(iconName)}
								className={`p-3 flex items-center justify-center rounded-lg transition-colors ${icon === iconName ? "bg-royal text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"}`}
							>
								{renderIcon(iconName)}
							</button>
						))}
					</div>
				</div>
			</form>
		</Modal>
	);
}

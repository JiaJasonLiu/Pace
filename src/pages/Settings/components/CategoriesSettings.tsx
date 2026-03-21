import * as Icons from "lucide-react";
import { Edit2, Plus } from "lucide-react";
import { useState } from "react";
import type { Category, TransactionType } from "../../../types";
import type { CategoriesSettingsProps } from "../types";
import { CategoryModal } from "./CategoryModal";

export function CategoriesSettings({
	categories,
	onAddCategory,
	onUpdateCategory,
	onDeleteCategory,
}: CategoriesSettingsProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const handleOpenAdd = () => {
		setEditingCategory(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (c: Category) => {
		setEditingCategory(c);
		setIsModalOpen(true);
	};

	const handleSave = (categoryData: Category) => {
		if (editingCategory) {
			onUpdateCategory(categoryData);
		} else {
			onAddCategory(categoryData);
		}
		setIsModalOpen(false);
	};

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this category?")) {
			onDeleteCategory(id);
			setIsModalOpen(false);
		}
	};

	const renderIcon = (iconName: string) => {
		const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
		return <IconComponent className="w-5 h-5" />;
	};

	const getCategoryColors = (
		lifestyleType: string | undefined,
		type: TransactionType,
	) => {
		if (type === "income") return "bg-notion-green-light text-notion-green";
		switch (lifestyleType) {
			case "need":
				return "bg-royal-light text-royal";
			case "want":
				return "bg-notion-blue-light text-notion-blue";
			case "savings":
				return "bg-notion-green-light text-notion-green";
			default:
				return "bg-slate-100 text-slate-500";
		}
	};

	const renderCategoryGroup = (filterFn: (c: Category) => boolean) => {
		const mainCategories = (categories || []).filter(
			(c) => filterFn(c) && !c.mainCategoryId,
		);

		return mainCategories.map((mainCat) => {
			const subCategories = (categories || []).filter(
				(c) => c.mainCategoryId === mainCat.id,
			);

			return (
				<div key={mainCat.id} className="space-y-2">
					<div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
						<div className="flex items-center">
							<div
								className={`w-10 h-10 ${getCategoryColors(mainCat.lifestyleType, mainCat.type)} rounded-full flex items-center justify-center mr-4`}
							>
								{renderIcon(mainCat.icon)}
							</div>
							<div className="text-left">
								<div className="flex items-center gap-2">
									<span className="block font-medium text-slate-800">
										{mainCat.name}
									</span>
									{(!mainCat.lifestyleType ||
										mainCat.lifestyleType === "none" ||
										mainCat.lifestyleType === "savings") && (
										<span
											className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${mainCat.type === "income" ? "bg-notion-green-light text-notion-green" : "bg-rose-100 text-rose-700"}`}
										>
											{mainCat.type}
										</span>
									)}
								</div>
							</div>
						</div>
						<button
							onClick={() => handleOpenEdit(mainCat)}
							className="p-2 text-slate-400 hover:text-royal transition-colors"
						>
							<Edit2 className="w-4 h-4" />
						</button>
					</div>

					{subCategories.length > 0 && (
						<div className="pl-12 space-y-2">
							{subCategories.map((subCat) => (
								<div
									key={subCat.id}
									className="flex items-center justify-between bg-slate-50/80 p-3 rounded-xl shadow-sm border border-slate-100"
								>
									<div className="flex items-center">
										<div
											className={`w-8 h-8 ${getCategoryColors(subCat.lifestyleType, subCat.type)} rounded-full flex items-center justify-center mr-3`}
										>
											{renderIcon(subCat.icon)}
										</div>
										<div className="text-left">
											<span className="block text-sm font-medium text-slate-800">
												{subCat.name}
											</span>
										</div>
									</div>
									<button
										onClick={() => handleOpenEdit(subCat)}
										className="p-1.5 text-slate-400 hover:text-royal transition-colors"
									>
										<Edit2 className="w-3.5 h-3.5" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			);
		});
	};

	return (
		<div className="space-y-6 pb-20">
			<div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
				<h2 className="text-lg font-medium mb-2">Categories</h2>
				<p className="text-slate-300 text-sm leading-relaxed">
					Customize your income and expense categories.
				</p>
			</div>

			<div className="space-y-8">
				{/* Needs Section */}
				<div>
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-royal-light text-royal rounded-lg flex items-center justify-center mr-2">
							<Icons.ShieldCheck className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							Needs
						</h3>
					</div>
					<div className="space-y-2">
						{renderCategoryGroup((c) => c.lifestyleType === "need")}
					</div>
				</div>

				{/* Wants Section */}
				<div>
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-notion-blue-light text-notion-blue rounded-lg flex items-center justify-center mr-2">
							<Icons.Heart className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							Wants
						</h3>
					</div>
					<div className="space-y-2">
						{renderCategoryGroup((c) => c.lifestyleType === "want")}
					</div>
				</div>

				{/* Savings Section */}
				<div>
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-notion-green-light text-notion-green rounded-lg flex items-center justify-center mr-2">
							<Icons.PiggyBank className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							Savings
						</h3>
					</div>
					<div className="space-y-2">
						{renderCategoryGroup((c) => c.lifestyleType === "savings")}
					</div>
				</div>

				{/* Income Section */}
				<div>
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-notion-green-light text-notion-green rounded-lg flex items-center justify-center mr-2">
							<Icons.Briefcase className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							Regular Income
						</h3>
					</div>
					<div className="space-y-2">
						{renderCategoryGroup((c) => c.lifestyleType === "income")}
					</div>
				</div>

				{/* Other Section */}
				<div>
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mr-2">
							<Icons.MoreHorizontal className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							Other / Uncategorized
						</h3>
					</div>
					<div className="space-y-2">
						{renderCategoryGroup(
							(c) => c.lifestyleType === "none" || !c.lifestyleType,
						)}
					</div>
				</div>
			</div>

			<button
				onClick={handleOpenAdd}
				className="fixed bottom-24 right-6 w-14 h-14 bg-royal text-white rounded-full shadow-lg shadow-royal/30 flex items-center justify-center hover:bg-royal-dark transition-transform active:scale-95 z-30"
			>
				<Plus className="w-6 h-6" />
			</button>

			<CategoryModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSave}
				onDelete={handleDelete}
				editingCategory={editingCategory}
				categories={categories}
			/>
		</div>
	);
}

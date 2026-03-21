import * as Icons from "lucide-react";
import { Calendar, Plus } from "lucide-react";
import type React from "react";
import { getCategoryColors } from "../lib/utils";
import type { TransactionCardProps } from "./types";

export const TransactionCard: React.FC<TransactionCardProps> = (props) => {
	const {
		transaction,
		category,
		mainCategory,
		currency,
		onClick,
		onAdd,
		icon,
		iconBgColor,
		iconTextColor,
		showLifestyleType = false,
		rightElement,
		customSubtitle,
		isFixedCost,
	} = props;

	const [bg, text] = getCategoryColors(
		category?.lifestyleType,
		transaction.type,
	).split(" ");
	const finalBgColor = iconBgColor || bg;
	const finalTextColor = iconTextColor || text;

	const isScheduled = transaction.status === "scheduled";

	const renderCategoryIcon = (iconName: string) => {
		const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
		return <IconComponent className="w-3 h-3 mr-1" />;
	};

	return (
		<div
			onClick={onClick}
			className={`flex justify-between items-center p-4 rounded-xl shadow-sm border cursor-pointer hover:border-royal/30 hover:shadow-md transition-all active:scale-[0.98] ${
				isScheduled ? "border-dashed border-slate-200" : "border-slate-50"
			} bg-white`}
		>
			<div className="flex items-center">
				<div
					className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${finalBgColor} ${finalTextColor} ${isScheduled ? "opacity-50" : ""}`}
				>
					{icon}
				</div>
				<div>
					<div className="flex items-center gap-2">
						{isScheduled && <Calendar className="w-3.5 h-3.5 text-amber-500" />}
						<p
							className={`font-medium ${isScheduled ? "text-slate-400" : "text-slate-800"}`}
						>
							{transaction.description || category?.name}
						</p>
						{isFixedCost && (
							<span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
								Fixed
							</span>
						)}
					</div>
					<div className="flex items-center text-xs text-slate-400 mt-0.5">
						{customSubtitle
							? customSubtitle
							: category && (
									<span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] mr-2 flex items-center">
										{renderCategoryIcon(category.icon)}
										{mainCategory
											? `${mainCategory.name} • ${category.name}`
											: category.name}
									</span>
								)}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span
					className={`font-mono font-medium ${transaction.type === "income" ? "text-notion-green" : "text-slate-800"} ${isScheduled ? "line-through opacity-50" : ""}`}
				>
					{transaction.type === "income" ? "+" : ""}
					{transaction.amount.toFixed(2)}
				</span>
				{isScheduled && onAdd && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onAdd(e);
						}}
						className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors active:scale-90"
						title="Add to spending"
					>
						<Plus className="w-5 h-5" />
					</button>
				)}
				{rightElement}
			</div>
		</div>
	);
};

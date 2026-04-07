import * as Icons from "lucide-react";
import { Calendar, Plus } from "lucide-react";
import type React from "react";
import { getCategoryColors } from "../lib/utils";
import type { TransactionCardProps } from "./types";

export const TransactionCard: React.FC<TransactionCardProps> = (props) => {
	const {
		transaction,
		category,
		onClick,
		onAdd,
		icon,
		iconBgColor,
		iconTextColor,
		showLifestyleType: _showLifestyleType = false,
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
			className={`flex justify-between items-center gap-3 p-4 rounded-xl shadow-sm border cursor-pointer hover:border-royal/30 hover:shadow-md transition-all active:scale-[0.98] ${
				isScheduled ? "border-dashed border-slate-200" : "border-slate-50"
			} bg-white`}
		>
			<div className="flex min-w-0 flex-1 items-center">
				<div
					className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${finalBgColor} ${finalTextColor} ${isScheduled ? "opacity-50" : ""}`}
				>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 items-center gap-2">
						{isScheduled && (
							<Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
						)}
						<p
							className={`min-w-0 flex-1 truncate font-medium ${isScheduled ? "text-slate-400" : "text-slate-800"}`}
						>
							{transaction.description || category?.name}
						</p>
						{isFixedCost && (
							<span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
								Fixed
							</span>
						)}
					</div>
					<div className="mt-0.5 flex min-w-0 items-center text-xs text-slate-400">
						{customSubtitle ? (
							<div className="min-w-0 truncate">{customSubtitle}</div>
						) : (
							category && (
								<span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
									<span className="shrink-0">
										{renderCategoryIcon(category.icon)}
									</span>
									<span className="min-w-0 truncate">{category.name}</span>
								</span>
							)
						)}
					</div>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-3">
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

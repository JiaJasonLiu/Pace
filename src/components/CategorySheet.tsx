import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Category } from "../types";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	categories: Category[];
	value: string;
	onChange: (value: string) => void;
};

const SECTION_ORDER = ["need", "want", "savings", "income", "none"] as const;
const SECTION_LABELS: Record<string, string> = {
	need: "Needs",
	want: "Wants",
	savings: "Savings",
	income: "Income",
	none: "Other",
};

export function CategorySheet({
	isOpen,
	onClose,
	categories,
	value,
	onChange,
}: Props) {
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	const grouped = SECTION_ORDER.reduce(
		(acc, type) => {
			const cats = categories.filter(
				(c) => (c.lifestyleType || "none") === type,
			);
			if (cats.length > 0) acc[type] = cats;
			return acc;
		},
		{} as Record<string, Category[]>,
	);

	const sections = SECTION_ORDER.filter((t) => grouped[t]);

	const sheet = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm"
					onClick={onClose}
				>
					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col"
						style={{ maxHeight: "70svh" }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-center pt-3 pb-2 flex-shrink-0">
							<div className="w-10 h-1 bg-slate-200 rounded-full" />
						</div>
						<div className="px-4 pb-3 flex-shrink-0">
							<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
								Category
							</p>
						</div>
						<div className="overflow-y-auto flex-1 px-4 pb-8 space-y-5">
							{sections.map((section) => (
								<div key={section}>
									<p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
										{SECTION_LABELS[section]}
									</p>
									<div className="grid grid-cols-4 gap-2">
										{grouped[section].map((cat) => {
											const IconComponent =
												(
													Icons as unknown as Record<string, LucideIcon>
												)[cat.icon] || Icons.HelpCircle;
											const isSelected = cat.name === value;
											return (
												<button
													key={cat.id}
													type="button"
													onClick={() => {
														onChange(cat.name);
														onClose();
													}}
													className={`flex flex-col items-center justify-start gap-1 p-2 pt-3 rounded-xl border transition-all active:scale-95 ${
														isSelected
															? "bg-royal/10 border-royal/30 text-royal-dark"
															: "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
													}`}
												>
													<IconComponent className="w-5 h-5 shrink-0" />
													<span className="text-[10px] font-medium leading-tight text-center line-clamp-2 w-full">
														{cat.name}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return createPortal(sheet, document.body);
}

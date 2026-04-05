import { addWeeks, format, parseISO, subWeeks } from "date-fns";
import * as Icons from "lucide-react";
import {
	ArrowDownCircle,
	ArrowUpCircle,
	ChevronLeft,
	ChevronRight,
	Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { TransactionCard } from "../../components/TransactionCard";
import { TransactionModal } from "../../components/TransactionModal";
import { formatCurrency } from "../../lib/utils";
import type { RecurrenceType, Transaction, TransactionType } from "../../types";
import type { SpendingViewProps } from "./types";
import { useSpendingData } from "./hooks/useSpendingData";

export function SpendingView({
	transactions,
	recurringTransactions,
	categories,
	wallets,
	currency,
	onAddTransaction,
	onUpdateTransaction,
	onDeleteTransaction,
	onAddRecurringTransaction,
	onUpdateRecurringTransaction,
	onDeleteRecurringTransaction,
	onSkipRecurringDate,
}: SpendingViewProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [direction, setDirection] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);

	const {
		allDisplayTransactions,
		weeklyIncome,
		weeklyExpense,
		weeklyBalance,
		weekStart,
		weekEnd,
	} = useSpendingData(transactions, recurringTransactions, currentDate);

	const weekRange = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;

	const handlePrevWeek = () => {
		setDirection(-1);
		setCurrentDate((prev) => subWeeks(prev, 1));
	};

	const handleNextWeek = () => {
		setDirection(1);
		setCurrentDate((prev) => addWeeks(prev, 1));
	};

	const handleOpenEdit = (t: Transaction) => {
		setEditingTransaction(t);
		setIsModalOpen(true);
	};

	const handleDelete = () => {
		if (editingTransaction) {
			if (editingTransaction.id.startsWith("scheduled-")) {
				const withoutPrefix = editingTransaction.id.replace("scheduled-", "");
				const lastDashIndex = withoutPrefix.lastIndexOf("-");
				const recurringId = withoutPrefix.substring(0, lastDashIndex);
				onSkipRecurringDate(recurringId, editingTransaction.date);
			} else {
				onDeleteTransaction(editingTransaction.id);
			}
			setIsModalOpen(false);
		}
	};

	const handleSave = (data: {
		amount: number;
		type: TransactionType;
		category: string;
		description: string;
		date: string;
		walletId?: string;
		recurrence: RecurrenceType | "none";
		status: "posted" | "scheduled";
		isFixedCost?: boolean;
	}) => {
		const {
			amount,
			type,
			category,
			description,
			date,
			walletId,
			recurrence,
			status,
			isFixedCost,
		} = data;

		if (editingTransaction) {
			let recurringId = editingTransaction.recurringId;

			if (recurrence === "none") {
				if (recurringId) {
					onDeleteRecurringTransaction(recurringId);
					recurringId = undefined;
				}
			} else {
				if (recurringId) {
					const existingRule = recurringTransactions.find(
						(r) => r.id === recurringId,
					);
					if (existingRule) {
						onUpdateRecurringTransaction({
							...existingRule,
							amount,
							type,
							category,
							description,
							walletId,
							recurrence: recurrence as RecurrenceType,
							isFixedCost,
						});
					}
				} else {
					// Converting normal to recurring
					recurringId = crypto.randomUUID();
					onAddRecurringTransaction({
						id: recurringId,
						amount,
						type,
						category,
						description,
						walletId,
						recurrence: recurrence as RecurrenceType,
						startDate: date,
						lastGeneratedDate: date,
						isActive: true,
						isFixedCost,
					});
				}
			}

			if (editingTransaction.id.startsWith("scheduled-")) {
				onAddTransaction({
					id: editingTransaction.id,
					date,
					amount,
					type,
					category,
					description,
					walletId,
					recurringId,
					status,
					isFixedCost,
				});
			} else {
				onUpdateTransaction({
					id: editingTransaction.id,
					date,
					amount,
					type,
					category,
					description,
					walletId,
					recurringId,
					status,
					isFixedCost,
				});
			}
		} else {
			const transactionId = crypto.randomUUID();
			let recurringId;

			if (recurrence !== "none") {
				recurringId = crypto.randomUUID();
				onAddRecurringTransaction({
					id: recurringId,
					amount,
					type,
					category,
					description,
					walletId,
					recurrence: recurrence as RecurrenceType,
					startDate: date,
					lastGeneratedDate: date,
					isActive: true,
					isFixedCost,
				});
			}

			onAddTransaction({
				id: transactionId,
				date,
				amount,
				type,
				category,
				description,
				walletId,
				recurringId,
				status,
				isFixedCost,
			});
		}
	};

	// Group transactions by day for the current week
	const groupedTransactions = allDisplayTransactions.reduce(
		(groups, t) => {
			const d = parseISO(t.date);
			const dayKey = format(d, "yyyy-MM-dd");
			if (!groups[dayKey]) groups[dayKey] = [];
			groups[dayKey].push(t);
			return groups;
		},
		{} as Record<string, Transaction[]>,
	);

	const handlePostScheduled = (e: React.MouseEvent, t: Transaction) => {
		e.stopPropagation();
		if (t.id.startsWith("scheduled-")) {
			// It's virtual, add it as a real record
			onAddTransaction({
				...t,
				id: t.id,
				status: "posted",
			});
		} else {
			// It's already a real record, just update status
			onUpdateTransaction({
				...t,
				status: "posted",
			});
		}
	};

	const renderCategoryIcon = (
		categoryName: string,
		tType: "income" | "expense",
	) => {
		const cat = (categories || []).find(
			(c) => c.name === categoryName && c.type === tType,
		);
		if (cat?.icon) {
			const IconComponent = (Icons as any)[cat.icon];
			if (IconComponent) return <IconComponent className="w-5 h-5" />;
		}
		return tType === "income" ? (
			<ArrowUpCircle className="w-5 h-5" />
		) : (
			<ArrowDownCircle className="w-5 h-5" />
		);
	};

	const sortedDays = Object.keys(groupedTransactions).sort((a, b) =>
		b.localeCompare(a),
	);

	const timestampVariants = {
		enter: (direction: number) => ({
			opacity: 0,
			x: direction * 20,
		}),
		center: {
			opacity: 1,
			x: 0,
		},
		exit: (direction: number) => ({
			opacity: 0,
			x: -direction * 20,
		}),
	};

	const slideVariants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 100 : -100,
			opacity: 0,
		}),
		center: {
			zIndex: 1,
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			zIndex: 0,
			x: direction < 0 ? 100 : -100,
			opacity: 0,
		}),
	};

	return (
		<div
			className="relative min-h-full pb-20 overflow-hidden"
			{...useSwipeable({
				onSwipedLeft: handleNextWeek,
				onSwipedRight: handlePrevWeek,
				trackMouse: true,
				trackTouch: !isModalOpen,
			})}
		>
			<div className="flex items-center justify-between mb-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
				<button
					onClick={handlePrevWeek}
					className="p-2 text-slate-400 hover:text-royal transition-colors"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>
				<div className="text-center overflow-hidden relative h-8 flex items-center justify-center w-[200px]">
					<AnimatePresence mode="wait" custom={direction}>
						<motion.h2
							key={weekRange}
							custom={direction}
							variants={timestampVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.4, ease: "easeInOut" }}
							className="text-lg font-medium text-slate-800 absolute whitespace-nowrap"
						>
							{weekRange}
						</motion.h2>
					</AnimatePresence>
				</div>
				<button
					onClick={handleNextWeek}
					className="p-2 text-slate-400 hover:text-royal transition-colors"
				>
					<ChevronRight className="w-6 h-6" />
				</button>
			</div>

			<AnimatePresence mode="wait" custom={direction}>
				<motion.div
					key={currentDate.toISOString()}
					custom={direction}
					variants={slideVariants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: "spring", stiffness: 300, damping: 30 },
						opacity: { duration: 0.2 },
					}}
					className="space-y-6"
				>
					<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
						<p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
							Weekly Balance
						</p>
						<h2
							className={`text-4xl font-light tracking-tight ${weeklyBalance >= 0 ? "text-royal-dark" : "text-red-500"}`}
						>
							{formatCurrency(weeklyBalance, currency)}
						</h2>

						<div className="flex w-full justify-between mt-6 pt-6 border-t border-slate-100">
							<div className="flex flex-col items-center">
								<div className="flex items-center text-notion-green mb-1">
									<ArrowUpCircle className="w-4 h-4 mr-1" />
									<span className="text-xs font-semibold uppercase tracking-wider">
										Income
									</span>
								</div>
								<span className="font-mono text-sm">
									{formatCurrency(weeklyIncome, currency)}
								</span>
							</div>
							<div className="flex flex-col items-center">
								<div className="flex items-center text-rose-500 mb-1">
									<ArrowDownCircle className="w-4 h-4 mr-1" />
									<span className="text-xs font-semibold uppercase tracking-wider">
										Expense
									</span>
								</div>
								<span className="font-mono text-sm">
									{formatCurrency(weeklyExpense, currency)}
								</span>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{sortedDays.length === 0 ? (
							<p className="text-center text-slate-400 py-8 text-sm">
								No transactions this week.
							</p>
						) : (
							sortedDays.map((day) => (
								<div key={day} className="space-y-3">
									<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1 flex justify-between items-center">
										<span>{format(parseISO(day), "EEEE MMM d")}</span>
										<span>
											{groupedTransactions[day]
												.filter((t) => t.status !== "scheduled")
												.reduce(
													(acc, t) =>
														acc + (t.type === "income" ? t.amount : -t.amount),
													0,
												) >= 0
												? "+"
												: ""}
											{groupedTransactions[day]
												.filter((t) => t.status !== "scheduled")
												.reduce(
													(acc, t) =>
														acc + (t.type === "income" ? t.amount : -t.amount),
													0,
												)
												.toFixed(2)}
										</span>
									</h3>
									<div className="space-y-2">
										<AnimatePresence initial={false}>
											{groupedTransactions[day]
												.sort(
													(a, b) =>
														new Date(b.date).getTime() -
														new Date(a.date).getTime(),
												)
												.map((t) => {
													const category = categories.find(
														(c) => c.name === t.category && c.type === t.type,
													);
													const mainCategory = category?.mainCategoryId
														? categories.find(
																(c) => c.id === category.mainCategoryId,
															)
														: undefined;
													const isScheduled = t.status === "scheduled";

													return (
														<motion.div
															key={t.id}
															layout
															initial={{ opacity: 0, height: 0 }}
															animate={{ opacity: 1, height: "auto" }}
															exit={{ opacity: 0, x: -100, height: 0 }}
															transition={{ duration: 0.2 }}
															className="relative overflow-hidden rounded-xl group swipe-card-container"
														>
															{/* Delete background action - only for non-scheduled */}
															{!isScheduled && (
																<div className="absolute inset-0 bg-slate-100 flex items-center justify-end pr-6 rounded-xl">
																	<div className="flex flex-col items-center text-slate-400">
																		<Icons.Trash2 className="w-5 h-5 mb-1" />
																		<span className="text-[10px] font-bold uppercase tracking-tighter">
																			Delete
																		</span>
																	</div>
																</div>
															)}

															<motion.div
																drag={isScheduled ? false : "x"}
																dragConstraints={{ left: -100, right: 0 }}
																dragElastic={0.05}
																onDragEnd={(_, info) => {
																	if (info.offset.x < -70) {
																		if (isScheduled) {
																			// Parse id: scheduled-{recurringId}-{dateISO}
																			const parts = t.id.split("-");
																			const recurringId = parts[1];
																			const date = parts.slice(2).join("-");
																			onSkipRecurringDate(recurringId, date);
																		} else {
																			onDeleteTransaction(t.id);
																		}
																	}
																}}
																onTouchStart={(e) => e.stopPropagation()}
																onTouchMove={(e) => e.stopPropagation()}
																className="relative z-10 bg-white rounded-xl"
															>
																<TransactionCard
																	transaction={t}
																	category={category}
																	mainCategory={mainCategory}
																	currency={currency}
																	onClick={() => handleOpenEdit(t)}
																	onAdd={
																		t.status === "scheduled"
																			? (e) => handlePostScheduled(e, t)
																			: undefined
																	}
																	icon={renderCategoryIcon(t.category, t.type)}
																	showLifestyleType={true}
																	isFixedCost={t.isFixedCost}
																/>
															</motion.div>
														</motion.div>
													);
												})}
										</AnimatePresence>
									</div>
								</div>
							))
						)}
					</div>
				</motion.div>
			</AnimatePresence>

			{/* Floating Action Button */}
			<button
				onClick={() => setIsModalOpen(true)}
				className="fixed bottom-24 right-6 w-14 h-14 bg-royal text-white rounded-full shadow-lg shadow-royal/30 flex items-center justify-center hover:bg-royal-dark transition-transform active:scale-95 z-30"
				aria-label="Add Transaction"
			>
				<Plus className="w-6 h-6" />
			</button>

			{/* Transaction Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<TransactionModal
						isOpen={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						onSave={handleSave}
						onDelete={editingTransaction ? handleDelete : undefined}
						initialData={
							editingTransaction
								? {
										...editingTransaction,
										recurrence: editingTransaction.recurringId
											? recurringTransactions.find(
													(r) => r.id === editingTransaction.recurringId,
												)?.recurrence
											: "none",
									}
								: undefined
						}
						categories={categories}
						wallets={wallets}
						currency={currency}
						title={editingTransaction ? "Edit Transaction" : "New Transaction"}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

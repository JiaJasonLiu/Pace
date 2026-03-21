import { addMonths, format, isSameMonth, parseISO, subMonths } from "date-fns";
import {
	ChevronLeft,
	ChevronRight,
	Heart,
	Info,
	PiggyBank,
	Plus,
	Settings,
	ShieldCheck,
	Trash2,
	Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { formatCurrency, getLifestyleColor } from "../../lib/utils";
import type { LifestyleGoal } from "../../types";
import { GoalModal } from "./components/GoalModal";
import { LifestyleSettingsModal } from "./components/LifestyleSettingsModal";
import { LogTransactionModal } from "./components/LogTransactionModal";
import { MotivationalEarningSection } from "./components/MotivationalEarningSection";
import type { LifestyleViewProps } from "./types";

export function LifestyleView({
	goals,
	wallets,
	transactions,
	categories,
	currency,
	lifestyleSettings,
	motivationalEarning,
	onAddGoal,
	onUpdateGoal,
	onDeleteGoal,
	onUpdateLifestyleSettings,
	onUpdateMotivationalEarning,
	onAddTransaction,
}: LifestyleViewProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const setSettingsOpen = (value: boolean) => {
		setIsSettingsOpen(value);
	};

	React.useEffect(() => {
		console.log("isSettingsOpen changed:", isSettingsOpen);
	}, [isSettingsOpen]);

	React.useEffect(() => {
		setIsSettingsOpen(false);
	}, []);
	const [isLoggingTransaction, setIsLoggingTransaction] = useState(false);
	const [editingGoal, setEditingGoal] = useState<LifestyleGoal | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<
		"need" | "want" | "savings" | null
	>(null);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [direction, setDirection] = useState(0);
	const [tLifestyleType, setTLifestyleType] = useState<
		"need" | "want" | "savings" | "income"
	>("need");

	const monthSwipeHandlers = useSwipeable({
		onSwipedLeft: () => handleNextMonth(),
		onSwipedRight: () => handlePrevMonth(),
		trackMouse: true,
	});

	const slideSwipeHandlers = useSwipeable({
		onSwipedLeft: () => handleNextSlide(),
		onSwipedRight: () => handlePrevSlide(),
		trackMouse: true,
	});

	const slides = ["overview", "motivational"] as const;
	const currentSlide = slides[currentSlideIndex];

	const handlePrevMonth = () => {
		setDirection(-1);
		setCurrentDate((prev) => subMonths(prev, 1));
	};

	const handleNextMonth = () => {
		setDirection(1);
		setCurrentDate((prev) => addMonths(prev, 1));
	};

	const handlePrevSlide = () => {
		setDirection(-1);
		setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
	};

	const handleNextSlide = () => {
		setDirection(1);
		setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
	};

	// Settings state
	const [incomeSource, setIncomeSource] = useState<"default_wallet" | "custom">(
		lifestyleSettings?.incomeSource || "default_wallet",
	);
	const [customIncomeAmount, setCustomIncomeAmount] = useState(
		lifestyleSettings?.customIncomeAmount?.toString() || "",
	);
	const [percentages, setPercentages] = useState(
		lifestyleSettings?.percentages || { need: 50, want: 30, savings: 20 },
	);

	// Update settings state when props change
	React.useEffect(() => {
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

	const _handleOpenLogTransaction = (type?: "need" | "want" | "savings") => {
		setTLifestyleType(type || "need");
		setIsLoggingTransaction(true);
	};

	const _handleSaveSettings = (e: React.FormEvent) => {
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
		setSettingsOpen(false);
	};

	const defaultWallet = wallets.find((w) => w.isDefault);
	const monthlyIncomeTransactions = transactions.filter(
		(t) => t.type === "income" && isSameMonth(parseISO(t.date), currentDate),
	);
	const actualMonthlyIncome = monthlyIncomeTransactions.reduce(
		(acc, t) => acc + t.amount,
		0,
	);

	const totalMonthlyIncome =
		lifestyleSettings?.incomeSource === "custom"
			? lifestyleSettings.customIncomeAmount || 0
			: defaultWallet?.monthlyIncome || actualMonthlyIncome || 0;

	const handleOpenAdd = () => {
		setEditingGoal(null);
		setIsAdding(true);
	};

	const handleEditGoal = (goal: LifestyleGoal) => {
		setEditingGoal(goal);
		setIsAdding(true);
	};

	const handleCloseModal = () => {
		setIsAdding(false);
		setEditingGoal(null);
	};

	const getCategoryColor = (cat: string) => {
		switch (cat) {
			case "need":
				return "text-royal";
			case "want":
				return "text-notion-blue";
			case "savings":
				return "text-notion-green";
			default:
				return "text-slate-600";
		}
	};

	const getCategoryBg = (cat: string) => {
		switch (cat) {
			case "need":
				return "bg-royal-light";
			case "want":
				return "bg-notion-blue-light";
			case "savings":
				return "bg-notion-green-light";
			default:
				return "bg-slate-100";
		}
	};

	const getCategoryIcon = (cat: string) => {
		switch (cat) {
			case "need":
				return <ShieldCheck className="w-4 h-4" />;
			case "want":
				return <Heart className="w-4 h-4" />;
			case "savings":
				return <PiggyBank className="w-4 h-4" />;
			default:
				return null;
		}
	};

	const calculateMonthlyRequirement = (goal: LifestyleGoal) => {
		return goal.targetAmount;
	};

	const totals = {
		need: goals
			.filter((g) => g.category === "need")
			.reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
		want: goals
			.filter((g) => g.category === "want")
			.reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
		savings: goals
			.filter((g) => g.category === "savings")
			.reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
	};

	const _totalRequirement = totals.need + totals.want + totals.savings;

	const currentPercentages = lifestyleSettings?.percentages || {
		need: 50,
		want: 30,
		savings: 20,
	};

	const ruleTargets = {
		need: totalMonthlyIncome * (currentPercentages.need / 100),
		want: totalMonthlyIncome * (currentPercentages.want / 100),
		savings: totalMonthlyIncome * (currentPercentages.savings / 100),
	};

	const monthlyTransactions = transactions.filter((t) =>
		isSameMonth(parseISO(t.date), currentDate),
	);

	const getLifestyleSpending = (type: "need" | "want" | "savings") => {
		return monthlyTransactions.reduce((acc, t) => {
			const cat = categories.find((c) => c.name === t.category);
			if (cat?.lifestyleType === type) {
				return acc + t.amount;
			}
			return acc;
		}, 0);
	};

	const actualSpending = {
		need: getLifestyleSpending("need"),
		want: getLifestyleSpending("want"),
		savings: getLifestyleSpending("savings"),
	};

	const totalRemaining =
		Math.max(0, ruleTargets.need - actualSpending.need) +
		Math.max(0, ruleTargets.want - actualSpending.want) +
		Math.max(0, ruleTargets.savings - actualSpending.savings);

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
		<div className="relative min-h-full pb-20 overflow-hidden">
			<div className="space-y-6">
				{/* Header - Always visible */}
				{totalMonthlyIncome > 0 ? (
					<div className="bg-royal text-white p-6 rounded-3xl shadow-xl shadow-royal/20 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

						<div className="flex items-center justify-between mb-6 relative z-10">
							<div className="flex items-center">
								<Trophy className="w-6 h-6 text-gold mr-2" />
								<h2 className="text-xl font-bold">Lifestyle Blueprint</h2>
							</div>
							<button
								onClick={() => setIsSettingsOpen(true)}
								className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
								aria-label="Lifestyle Settings"
							>
								<Settings className="w-5 h-5" />
							</button>
						</div>

						<div className="relative z-10">
							<div className="flex items-center mb-1">
								<Info className="w-3.5 h-3.5 mr-1.5 text-royal-light" />
								<p className="text-[10px] font-bold uppercase tracking-widest text-royal-light">
									Total Monthly Remaining
								</p>
							</div>
							<p className="text-4xl font-light">
								{formatCurrency(totalRemaining, currency)}
							</p>
						</div>
					</div>
				) : (
					<div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 bg-royal/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
						<div className="flex items-center justify-between mb-1 relative z-10">
							<div className="flex items-center">
								<Trophy className="w-6 h-6 text-gold mr-2" />
								<h2 className="text-xl font-bold">Lifestyle Blueprint</h2>
							</div>
							<button
								onClick={() => setIsSettingsOpen(true)}
								className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
								aria-label="Lifestyle Settings"
							>
								<Settings className="w-5 h-5" />
							</button>
						</div>
						<p className="text-slate-400 text-sm leading-relaxed relative z-10">
							Apply your custom allocation rule to your dream lifestyle. Define
							what you need, what you want, and what you want to save.
						</p>
					</div>
				)}

				{/* Month Selector and View Toggle */}
				{!selectedCategory && (
					<div className="flex flex-col space-y-4">
						<div
							{...monthSwipeHandlers}
							className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 touch-pan-y"
						>
							<button
								onClick={handlePrevMonth}
								className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-royal"
							>
								<ChevronLeft className="w-5 h-5" />
							</button>
							<div className="text-center overflow-hidden relative h-8 flex items-center justify-center w-[180px]">
								<AnimatePresence mode="wait" custom={direction}>
									<motion.p
										key={currentDate.toISOString()}
										custom={direction}
										variants={timestampVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.4, ease: "easeInOut" }}
										className="text-lg font-medium text-slate-800 absolute whitespace-nowrap"
									>
										{format(currentDate, "MMMM yyyy")}
									</motion.p>
								</AnimatePresence>
							</div>
							<button
								onClick={handleNextMonth}
								className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-royal"
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						</div>

						<div className="flex p-1 bg-slate-100 rounded-xl">
							<button
								onClick={() => {
									setDirection(currentSlideIndex > 0 ? -1 : 0);
									setCurrentSlideIndex(0);
								}}
								className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currentSlideIndex === 0 ? "bg-white text-royal shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
							>
								Blueprint Overview
							</button>
							<button
								onClick={() => {
									setDirection(currentSlideIndex < 1 ? 1 : 0);
									setCurrentSlideIndex(1);
								}}
								className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currentSlideIndex === 1 ? "bg-white text-royal shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
							>
								Motivational Earnings
							</button>
						</div>
					</div>
				)}

				{selectedCategory ? (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<button
								onClick={() => setSelectedCategory(null)}
								className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
							>
								<ChevronLeft className="w-5 h-5 mr-1" />
								<span className="text-sm font-bold">Back to Blueprint</span>
							</button>
							<div
								className={`px-3 py-1 rounded-full ${getCategoryBg(selectedCategory)} ${getCategoryColor(selectedCategory)} text-[10px] font-bold uppercase tracking-widest`}
							>
								{selectedCategory}
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<div
								className={`w-12 h-12 rounded-2xl ${getCategoryBg(selectedCategory)} ${getCategoryColor(selectedCategory)} flex items-center justify-center`}
							>
								{getCategoryIcon(selectedCategory)}
							</div>
							<div>
								<h2 className="text-2xl font-bold text-slate-800 capitalize">
									{selectedCategory}s
								</h2>
								<p className="text-xs text-slate-400 font-medium">
									{selectedCategory === "savings" ? "Goal" : "Monthly Limit"}:{" "}
									{formatCurrency(ruleTargets[selectedCategory], currency)}
								</p>
							</div>
						</div>

						<div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
							<div className="flex justify-between items-end mb-4">
								<div>
									<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
										{selectedCategory === "savings"
											? ruleTargets[selectedCategory] -
													actualSpending[selectedCategory] <
												0
												? "Surplus"
												: "Remaining Goal"
											: "Remaining Budget"}
									</p>
									<p
										className={`text-3xl font-bold ${selectedCategory !== "savings" && ruleTargets[selectedCategory] - actualSpending[selectedCategory] < 0 ? "text-rose-500" : getCategoryColor(selectedCategory)}`}
									>
										{selectedCategory === "savings" &&
										ruleTargets[selectedCategory] -
											actualSpending[selectedCategory] <
											0
											? `+${formatCurrency(Math.abs(ruleTargets[selectedCategory] - actualSpending[selectedCategory]), currency)}`
											: formatCurrency(
													ruleTargets[selectedCategory] -
														actualSpending[selectedCategory],
													currency,
												)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
										{selectedCategory === "savings"
											? "Saved This Month"
											: "Spent This Month"}
									</p>
									<p className="text-lg font-bold text-slate-800">
										{formatCurrency(actualSpending[selectedCategory], currency)}
									</p>
								</div>
							</div>
							<div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
								<div
									className={`h-full transition-all duration-500 ${selectedCategory !== "savings" && actualSpending[selectedCategory] > ruleTargets[selectedCategory] ? "bg-rose-500" : getCategoryColor(selectedCategory).replace("text-", "bg-")}`}
									style={{
										width: `${Math.max(
											0,
											Math.min(
												100,
												selectedCategory === "savings"
													? (actualSpending[selectedCategory] /
															ruleTargets[selectedCategory]) *
															100
													: 100 -
															(actualSpending[selectedCategory] /
																ruleTargets[selectedCategory]) *
																100,
											),
										)}%`,
									}}
								></div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<div className="pt-4 border-t border-slate-100">
								<h3 className="text-sm font-bold text-slate-800 px-1 mb-4">
									{selectedCategory === "savings"
										? "Savings Goals"
										: "Planned Monthly Expenses"}
								</h3>
								{goals.filter((g) => g.category === selectedCategory).length ===
									0 &&
								monthlyTransactions.filter(
									(t) =>
										categories.find((c) => c.name === t.category)
											?.lifestyleType === selectedCategory &&
										!goals
											.filter((g) => g.category === selectedCategory)
											.map((g) => g.title)
											.includes(t.category),
								).length === 0 ? (
									<div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
										<p className="text-slate-400 text-sm font-medium">
											No {selectedCategory} items defined yet.
										</p>
										<button
											onClick={handleOpenAdd}
											className="mt-4 text-royal font-bold text-sm hover:underline"
										>
											Add your first {selectedCategory}
										</button>
									</div>
								) : (
									<div className="space-y-4">
										{goals
											.filter((g) => g.category === selectedCategory)
											.map((goal) => {
												const goalTransactions = transactions.filter(
													(t) =>
														t.category === goal.title &&
														t.type ===
															(selectedCategory === "income"
																? "income"
																: "expense"),
												);
												const actualAmount = goalTransactions.reduce(
													(acc, t) => acc + t.amount,
													0,
												);

												return (
													<div
														key={goal.id}
														onClick={() => handleEditGoal(goal)}
														className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group hover:border-royal/20 transition-all cursor-pointer"
													>
														<button
															onClick={(e) => {
																e.stopPropagation();
																onDeleteGoal(goal.id);
															}}
															className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
															aria-label="Delete goal"
														>
															<Trash2 className="w-4 h-4" />
														</button>

														<div className="flex items-start justify-between mb-2">
															<h4 className="font-bold text-slate-800 pr-8">
																{goal.title}
															</h4>
														</div>

														<div className="flex justify-between items-baseline mb-3">
															<p
																className={`font-mono font-bold ${getCategoryColor(selectedCategory)}`}
															>
																{selectedCategory === "savings" ? (
																	<>
																		{formatCurrency(
																			goal.targetAmount,
																			currency,
																		)}
																		<span className="text-[10px] text-slate-400 font-sans font-normal uppercase tracking-widest ml-2">
																			Target
																		</span>
																	</>
																) : (
																	formatCurrency(goal.targetAmount, currency)
																)}
															</p>
														</div>

														{goal.description && (
															<p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">
																"{goal.description}"
															</p>
														)}

														{/* Progress bar for monthly expenses */}
														{selectedCategory !== "savings" && (
															<div className="mb-4">
																<div className="flex justify-between items-end mb-1">
																	<p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
																		{actualAmount > goal.targetAmount
																			? "Overspent"
																			: "Remaining"}
																	</p>
																	<p
																		className={`text-xs font-bold ${actualAmount > goal.targetAmount ? "text-rose-500" : `text-${getLifestyleColor(selectedCategory || undefined)}`}`}
																	>
																		{actualAmount > goal.targetAmount
																			? `-${formatCurrency(actualAmount - goal.targetAmount, currency)}`
																			: formatCurrency(
																					goal.targetAmount - actualAmount,
																					currency,
																				)}
																	</p>
																</div>
																<div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
																	<div
																		className={`h-full transition-all duration-500 ${actualAmount > goal.targetAmount ? "bg-rose-500" : `bg-${getLifestyleColor(selectedCategory || undefined)}`}`}
																		style={{
																			width: `${Math.max(0, 100 - (actualAmount / goal.targetAmount) * 100)}%`,
																		}}
																	></div>
																</div>
															</div>
														)}

														{/* Transactions Summary */}
														{goalTransactions.length > 0 && (
															<div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
																<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
																	Transactions
																</p>
																{goalTransactions.slice(0, 3).map((t) => (
																	<div
																		key={t.id}
																		className="flex justify-between items-center text-xs"
																	>
																		<span className="text-slate-600 truncate pr-4">
																			{t.description || t.category}
																		</span>
																		<span className="font-mono font-medium text-slate-800">
																			{formatCurrency(t.amount, currency)}
																		</span>
																	</div>
																))}
																{goalTransactions.length > 3 && (
																	<p className="text-[10px] text-slate-400 text-center pt-1">
																		+{goalTransactions.length - 3} more
																	</p>
																)}
															</div>
														)}

														{selectedCategory === "savings" && (
															<div className="mb-2">
																<div className="flex justify-between items-end mb-1">
																	<p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
																		Progress
																	</p>
																	<p
																		className={`text-xs font-bold text-notion-green`}
																	>
																		{Math.round(
																			((goal.currentAmount || 0) /
																				goal.targetAmount) *
																				100,
																		)}
																		%
																	</p>
																</div>
																<div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
																	<div
																		className={`h-full bg-notion-green transition-all duration-500`}
																		style={{
																			width: `${Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100)}%`,
																		}}
																	></div>
																</div>
																<div className="flex justify-between mt-1">
																	<p className="text-[10px] text-slate-400">
																		{formatCurrency(
																			goal.currentAmount || 0,
																			currency,
																		)}{" "}
																		saved
																	</p>
																</div>
																<div
																	className={`mt-3 p-2 bg-notion-green-light rounded-lg border border-notion-green-light`}
																>
																	<p
																		className={`text-[10px] text-notion-green font-medium`}
																	>
																		Monthly target:{" "}
																		<span className="font-bold">
																			{formatCurrency(
																				calculateMonthlyRequirement(goal),
																				currency,
																			)}
																		</span>
																	</p>
																</div>
															</div>
														)}
													</div>
												);
											})}

										{/* Unplanned Card */}
										{(() => {
											const goalTitles = goals
												.filter((g) => g.category === selectedCategory)
												.map((g) => g.title);
											const unplannedTransactions = monthlyTransactions.filter(
												(t) =>
													categories.find((c) => c.name === t.category)
														?.lifestyleType === selectedCategory &&
													!goalTitles.includes(t.category),
											);

											if (unplannedTransactions.length === 0) return null;

											const totalOthers = unplannedTransactions.reduce(
												(acc, t) => acc + t.amount,
												0,
											);

											return (
												<div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group hover:border-royal/20 transition-all">
													<div className="flex justify-between items-center mb-4">
														<div>
															<h4 className="font-bold text-slate-800">
																Unplanned {selectedCategory}
															</h4>
															<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
																Total Summary
															</p>
														</div>
														<div className="text-right">
															<p className="text-lg font-mono font-bold text-slate-900">
																{formatCurrency(totalOthers, currency)}
															</p>
														</div>
													</div>

													<div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
														<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
															Recent Items
														</p>
														{unplannedTransactions.slice(0, 5).map((t) => (
															<div
																key={t.id}
																className="flex justify-between items-center text-xs"
															>
																<span className="text-slate-600 truncate pr-4">
																	{t.description || t.category}
																</span>
																<span className="font-mono font-medium text-slate-800">
																	{formatCurrency(t.amount, currency)}
																</span>
															</div>
														))}
														{unplannedTransactions.length > 5 && (
															<p className="text-[10px] text-slate-400 text-center pt-1">
																+{unplannedTransactions.length - 5} more
															</p>
														)}
													</div>
												</div>
											);
										})()}
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<>
						{/* Tab Indicators */}
						<div className="flex justify-center space-x-2 my-2">
							{slides.map((slide, idx) => (
								<button
									key={slide}
									onClick={() => {
										setDirection(idx > currentSlideIndex ? 1 : -1);
										setCurrentSlideIndex(idx);
									}}
									className={`h-2 rounded-full transition-all ${idx === currentSlideIndex ? "bg-royal w-6" : "bg-slate-300 w-2"}`}
									aria-label={`Go to ${slide} slide`}
								/>
							))}
						</div>

						<AnimatePresence mode="wait" custom={direction}>
							<motion.div
								key={currentSlideIndex}
								{...slideSwipeHandlers}
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									x: { type: "spring", stiffness: 300, damping: 30 },
									opacity: { duration: 0.2 },
								}}
								className="space-y-6 touch-pan-y"
							>
								{currentSlide === "motivational" ? (
									<MotivationalEarningSection
										motivationalEarning={motivationalEarning}
										currency={currency}
										onUpdate={onUpdateMotivationalEarning}
									/>
								) : totalMonthlyIncome === 0 ? (
									<div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex flex-col items-center text-center">
										<div className="w-12 h-12 bg-notion-green-light rounded-2xl flex items-center justify-center mb-4">
											<Info className="w-6 h-6 text-notion-green" />
										</div>
										<h3 className="text-lg font-bold text-slate-800">
											Set Your Lifestyle Income
										</h3>
										<p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs">
											To calculate your monthly targets, we need to know your
											monthly budget.
										</p>
										<button
											onClick={() => setSettingsOpen(true)}
											className="px-6 py-3 bg-notion-green text-white rounded-2xl font-bold hover:bg-notion-green-dark transition-colors shadow-lg shadow-notion-green/20"
										>
											Configure Income Source
										</button>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										{[
											{
												label: `Needs (${currentPercentages.need}%)`,
												key: "need",
												target: ruleTargets.need,
												current: actualSpending.need,
												remaining: ruleTargets.need - actualSpending.need,
												color: "royal",
											},
											{
												label: `Wants (${currentPercentages.want}%)`,
												key: "want",
												target: ruleTargets.want,
												current: actualSpending.want,
												remaining: ruleTargets.want - actualSpending.want,
												color: "notion-blue",
											},
											{
												label: `Savings (${currentPercentages.savings}%)`,
												key: "savings",
												target: ruleTargets.savings,
												current: actualSpending.savings,
												remaining: ruleTargets.savings - actualSpending.savings,
												color: "notion-green",
											},
										].map((item) => (
											<button
												key={item.key}
												onClick={() => setSelectedCategory(item.key as any)}
												className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-left hover:border-royal/30 hover:shadow-md transition-all active:scale-[0.98] group"
											>
												<div className="flex justify-between items-start mb-2">
													<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
														{item.label}
													</p>
													<div className={`text-${item.color}`}>
														{getCategoryIcon(item.key)}
													</div>
												</div>
												<p
													className={`text-xl font-bold ${item.key !== "savings" && item.remaining < 0 ? "text-rose-500" : `text-${item.color}`}`}
												>
													{item.key === "savings" && item.remaining < 0
														? `+${formatCurrency(Math.abs(item.remaining), currency)}`
														: formatCurrency(item.remaining, currency)}
												</p>
												<p className="text-[10px] text-slate-400 font-medium mt-1">
													{item.key === "savings"
														? item.remaining < 0
															? "Surplus"
															: "Remaining goal"
														: "Remaining limit"}
												</p>

												<div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
													<div
														className={`h-full ${item.key === "need" ? "bg-royal" : item.key === "want" ? "bg-notion-blue" : "bg-notion-green"} transition-all duration-500`}
														style={{
															width: `${Math.max(
																0,
																Math.min(
																	100,
																	item.key === "savings"
																		? (item.current / item.target) * 100
																		: 100 - (item.current / item.target) * 100,
																),
															)}%`,
														}}
													></div>
												</div>
												<div className="flex justify-between mt-2">
													<p className="text-[10px] text-slate-400 font-medium">
														{item.key === "savings" ? "Goal" : "Limit"}:{" "}
														{formatCurrency(item.target, currency)}
													</p>
													<p
														className={`text-[10px] font-bold ${item.key !== "savings" && item.current > item.target ? "text-rose-500" : "text-notion-green"}`}
													>
														{item.key === "savings" ? "Saved" : "Spent"}:{" "}
														{formatCurrency(item.current, currency)}
													</p>
												</div>
												<div className="mt-4 flex items-center text-[10px] font-bold text-royal opacity-0 group-hover:opacity-100 transition-opacity">
													View Details <ChevronRight className="w-3 h-3 ml-1" />
												</div>
											</button>
										))}
									</div>
								)}
							</motion.div>
						</AnimatePresence>
					</>
				)}
			</div>

			{/* Floating Action Button */}
			{lifestyleSettings && (
				<button
					onClick={handleOpenAdd}
					className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/20 flex items-center justify-center hover:bg-slate-800 transition-transform active:scale-95 z-30"
					aria-label="Add Lifestyle Goal"
				>
					<Plus className="w-6 h-6" />
				</button>
			)}

			{/* Goal Modal */}
			<AnimatePresence>
				{isAdding && (
					<GoalModal
						isOpen={isAdding}
						onClose={handleCloseModal}
						onAddGoal={onAddGoal}
						onUpdateGoal={onUpdateGoal}
						editingGoal={editingGoal}
						currency={currency}
						wallets={wallets}
						selectedCategory={selectedCategory}
						categories={categories}
					/>
				)}
			</AnimatePresence>

			{/* Transaction Logging Modal */}
			<AnimatePresence>
				{isLoggingTransaction && (
					<LogTransactionModal
						isOpen={isLoggingTransaction}
						onClose={() => setIsLoggingTransaction(false)}
						onAddTransaction={(t) => {
							onAddTransaction(t);
							setIsLoggingTransaction(false);
						}}
						currency={currency}
						categories={categories}
						wallets={wallets}
						initialType={tLifestyleType}
					/>
				)}
			</AnimatePresence>

			{/* Settings Modal */}
			<AnimatePresence>
				{isSettingsOpen && (
					<LifestyleSettingsModal
						isOpen={isSettingsOpen}
						onClose={() => setSettingsOpen(false)}
						onUpdateLifestyleSettings={onUpdateLifestyleSettings}
						currency={currency}
						defaultWallet={defaultWallet}
						lifestyleSettings={lifestyleSettings}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

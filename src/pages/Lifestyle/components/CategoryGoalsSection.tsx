import { isSameMonth, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { formatCurrency } from "../../../lib/utils";
import type { Category, LifestyleGoal, Transaction } from "../../../types";

type LifestyleBucket = "need" | "want" | "savings";

interface CategoryGoalsSectionProps {
	selectedCategory: LifestyleBucket;
	goals: LifestyleGoal[];
	transactions: Transaction[];
	categories: Category[];
	currency: string;
	currentDate: Date;
	ruleTargets: Record<LifestyleBucket, number>;
	actualSpending: Record<LifestyleBucket, number>;
	onEditGoal: (goal: LifestyleGoal) => void;
	onDeleteGoal: (id: string) => void;
	onOpenAdd: () => void;
}

function barColorForCategory(
	cat: LifestyleBucket,
	opts: { overspent?: boolean },
): string {
	if (opts.overspent) return "bg-rose-500";
	switch (cat) {
		case "need":
			return "bg-royal";
		case "want":
			return "bg-notion-blue";
		case "savings":
			return "bg-notion-green";
	}
}

export function CategoryGoalsSection({
	selectedCategory,
	goals,
	transactions,
	categories,
	currency,
	currentDate,
	ruleTargets,
	actualSpending,
	onEditGoal,
	onDeleteGoal,
	onOpenAdd,
}: CategoryGoalsSectionProps) {
	const monthlyTransactions = useMemo(
		() =>
			transactions.filter((t) => isSameMonth(parseISO(t.date), currentDate)),
		[transactions, currentDate],
	);

	const categoryGoals = useMemo(
		() => goals.filter((g) => g.category === selectedCategory),
		[goals, selectedCategory],
	);

	const goalTitles = useMemo(
		() => categoryGoals.map((g) => g.title),
		[categoryGoals],
	);

	const unplannedTransactions = useMemo(
		() =>
			monthlyTransactions.filter((t) => {
				const cat = categories.find((c) => c.name === t.category);
				return (
					cat?.lifestyleType === selectedCategory &&
					!goalTitles.includes(t.category)
				);
			}),
		[monthlyTransactions, categories, selectedCategory, goalTitles],
	);

	const showEmptyState =
		categoryGoals.length === 0 && unplannedTransactions.length === 0;

	const remaining =
		ruleTargets[selectedCategory] - actualSpending[selectedCategory];

	const ruleTarget = ruleTargets[selectedCategory];
	const safeRuleDivisor = ruleTarget > 0 ? ruleTarget : 1;

	const calculateMonthlyRequirement = (goal: LifestyleGoal) =>
		goal.targetAmount;

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<div className="mb-4 flex items-end justify-between">
					<div>
						<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
							{selectedCategory === "savings"
								? remaining < 0
									? "Surplus"
									: "Remaining Goal"
								: "Remaining Budget"}
						</p>
						<p
							className={`text-3xl font-bold ${
								selectedCategory !== "savings" && remaining < 0
									? "text-rose-500"
									: selectedCategory === "need"
										? "text-royal"
										: selectedCategory === "want"
											? "text-notion-blue"
											: "text-notion-green"
							}`}
						>
							{selectedCategory === "savings" && remaining < 0
								? `+${formatCurrency(Math.abs(remaining), currency)}`
								: formatCurrency(remaining, currency)}
						</p>
					</div>
					<div className="text-right">
						<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
							{selectedCategory === "savings"
								? "Saved This Month"
								: "Spent This Month"}
						</p>
						<p className="text-lg font-bold text-slate-800">
							{formatCurrency(actualSpending[selectedCategory], currency)}
						</p>
					</div>
				</div>
				<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
					<div
						className={`h-full transition-all duration-500 ${barColorForCategory(selectedCategory, {
							overspent:
								selectedCategory !== "savings" &&
								actualSpending[selectedCategory] >
									ruleTargets[selectedCategory],
						})}`}
						style={{
							width: `${Math.max(
								0,
								Math.min(
									100,
									selectedCategory === "savings"
										? (actualSpending[selectedCategory] / safeRuleDivisor) *
												100
										: 100 -
												(actualSpending[selectedCategory] / safeRuleDivisor) *
													100,
								),
							)}%`,
						}}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4">
				<div className="border-t border-slate-100 pt-4">
					<h3 className="mb-4 px-1 text-sm font-bold text-slate-800">
						{selectedCategory === "savings"
							? "Savings Goals"
							: "Planned Monthly Expenses"}
					</h3>
					{showEmptyState ? (
						<div className="rounded-3xl border-2 border-dashed border-slate-100 bg-white py-12 text-center">
							<p className="text-sm font-medium text-slate-400">
								No {selectedCategory} items defined yet.
							</p>
							<button
								type="button"
								onClick={onOpenAdd}
								className="mt-4 text-sm font-bold text-royal hover:underline"
							>
								Add your first {selectedCategory}
							</button>
						</div>
					) : (
						<div className="space-y-4">
							{categoryGoals.map((goal) => {
								const goalTransactions = monthlyTransactions.filter(
									(t) =>
										t.category === goal.title && t.type === "expense",
								);
								const actualAmount = goalTransactions.reduce(
									(acc, t) => acc + t.amount,
									0,
								);

								return (
									<div
										key={goal.id}
										role="button"
										tabIndex={0}
										onClick={() => onEditGoal(goal)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onEditGoal(goal);
											}
										}}
										className="group relative cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-royal/20"
									>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteGoal(goal.id);
											}}
											className="absolute right-4 top-4 text-slate-300 transition-colors hover:text-rose-500"
											aria-label="Delete goal"
										>
											<Trash2 className="h-4 w-4" />
										</button>

										<div className="mb-2 flex items-start justify-between">
											<h4 className="pr-8 font-bold text-slate-800">
												{goal.title}
											</h4>
										</div>

										<div className="mb-3 flex items-baseline justify-between">
											<p
												className={`font-mono font-bold ${
													selectedCategory === "need"
														? "text-royal"
														: selectedCategory === "want"
															? "text-notion-blue"
															: "text-notion-green"
												}`}
											>
												{selectedCategory === "savings" ? (
													<>
														{formatCurrency(goal.targetAmount, currency)}
														<span className="ml-2 font-sans text-[10px] font-normal uppercase tracking-widest text-slate-400">
															Target
														</span>
													</>
												) : (
													formatCurrency(goal.targetAmount, currency)
												)}
											</p>
										</div>

										{goal.description ? (
											<p className="mb-4 line-clamp-2 text-xs italic text-slate-500">
												{`"${goal.description}"`}
											</p>
										) : null}

										{selectedCategory !== "savings" ? (
											<div className="mb-4">
												<div className="mb-1 flex items-end justify-between">
													<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
														{actualAmount > goal.targetAmount
															? "Overspent"
															: "Remaining"}
													</p>
													<p
														className={`text-xs font-bold ${
															actualAmount > goal.targetAmount
																? "text-rose-500"
																: selectedCategory === "need"
																	? "text-royal"
																	: "text-notion-blue"
														}`}
													>
														{actualAmount > goal.targetAmount
															? `-${formatCurrency(actualAmount - goal.targetAmount, currency)}`
															: formatCurrency(
																	goal.targetAmount - actualAmount,
																	currency,
																)}
													</p>
												</div>
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
													<div
														className={`h-full transition-all duration-500 ${barColorForCategory(selectedCategory, {
															overspent: actualAmount > goal.targetAmount,
														})}`}
														style={{
															width: `${Math.max(
																0,
																goal.targetAmount > 0
																	? 100 -
																			(actualAmount / goal.targetAmount) * 100
																	: 0,
															)}%`,
														}}
													/>
												</div>
											</div>
										) : null}

										{goalTransactions.length > 0 ? (
											<div className="mt-4 space-y-2 border-t border-slate-50 pt-4">
												<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
													Transactions
												</p>
												{goalTransactions.slice(0, 3).map((t) => (
													<div
														key={t.id}
														className="flex items-center justify-between text-xs"
													>
														<span className="truncate pr-4 text-slate-600">
															{t.description || t.category}
														</span>
														<span className="font-mono font-medium text-slate-800">
															{formatCurrency(t.amount, currency)}
														</span>
													</div>
												))}
												{goalTransactions.length > 3 ? (
													<p className="pt-1 text-center text-[10px] text-slate-400">
														+{goalTransactions.length - 3} more
													</p>
												) : null}
											</div>
										) : null}

										{selectedCategory === "savings" ? (
											<div className="mb-2">
												<div className="mb-1 flex items-end justify-between">
													<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
														Progress
													</p>
													<p className="text-xs font-bold text-notion-green">
														{goal.targetAmount > 0
															? Math.round(
																	((goal.currentAmount || 0) / goal.targetAmount) *
																		100,
																)
															: 0}
														%
													</p>
												</div>
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
													<div
														className="h-full bg-notion-green transition-all duration-500"
														style={{
															width: `${Math.min(
																100,
																goal.targetAmount > 0
																	? ((goal.currentAmount || 0) / goal.targetAmount) *
																			100
																	: 0,
															)}%`,
														}}
													/>
												</div>
												<div className="mt-1 flex justify-between">
													<p className="text-[10px] text-slate-400">
														{formatCurrency(goal.currentAmount || 0, currency)}{" "}
														saved
													</p>
												</div>
												<div className="mt-3 rounded-lg border border-notion-green-light bg-notion-green-light p-2">
													<p className="text-[10px] font-medium text-notion-green">
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
										) : null}
									</div>
								);
							})}

							{unplannedTransactions.length > 0 ? (
								<div className="group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-royal/20">
									<div className="mb-4 flex items-center justify-between">
										<div>
											<h4 className="font-bold text-slate-800">
												Unplanned {selectedCategory}
											</h4>
											<p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
												Total Summary
											</p>
										</div>
										<div className="text-right">
											<p className="font-mono text-lg font-bold text-slate-900">
												{formatCurrency(
													unplannedTransactions.reduce(
														(acc, t) => acc + t.amount,
														0,
													),
													currency,
												)}
											</p>
										</div>
									</div>

									<div className="mt-4 space-y-2 border-t border-slate-50 pt-4">
										<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
											Recent Items
										</p>
										{unplannedTransactions.slice(0, 5).map((t) => (
											<div
												key={t.id}
												className="flex items-center justify-between text-xs"
											>
												<span className="truncate pr-4 text-slate-600">
													{t.description || t.category}
												</span>
												<span className="font-mono font-medium text-slate-800">
													{formatCurrency(t.amount, currency)}
												</span>
											</div>
										))}
										{unplannedTransactions.length > 5 ? (
											<p className="pt-1 text-center text-[10px] text-slate-400">
												+{unplannedTransactions.length - 5} more
											</p>
										) : null}
									</div>
								</div>
							) : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

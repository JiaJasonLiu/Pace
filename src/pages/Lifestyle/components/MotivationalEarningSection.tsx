import {
	CheckCircle2,
	Circle,
	Link as LinkIcon,
	Plus,
	Target,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { formatCurrency } from "../../../lib/utils";
import type { EarningAction } from "../../../types";
import type { MotivationalEarningSectionProps } from "../types";

export function MotivationalEarningSection({
	motivationalEarning,
	currency,
	onUpdate,
}: MotivationalEarningSectionProps) {
	const [isEditingGoal, setIsEditingGoal] = useState(!motivationalEarning);
	const [desiredLifestyle, setDesiredLifestyle] = useState(
		motivationalEarning?.desiredLifestyle || "",
	);
	const [requiredIncome, setRequiredIncome] = useState(
		motivationalEarning?.requiredIncome?.toString() || "",
	);

	const [isAddingAction, setIsAddingAction] = useState(false);
	const [actionTitle, setActionTitle] = useState("");
	const [actionDescription, setActionDescription] = useState("");
	const [actionEvidenceUrl, setActionEvidenceUrl] = useState("");

	const handleSaveGoal = (e: React.FormEvent) => {
		e.preventDefault();
		onUpdate({
			id: motivationalEarning?.id || crypto.randomUUID(),
			desiredLifestyle,
			requiredIncome: Number(requiredIncome),
			actions: motivationalEarning?.actions || [],
		});
		setIsEditingGoal(false);
	};

	const handleAddAction = (e: React.FormEvent) => {
		e.preventDefault();
		if (!motivationalEarning) return;

		const newAction: EarningAction = {
			id: crypto.randomUUID(),
			title: actionTitle,
			description: actionDescription,
			evidenceUrl: actionEvidenceUrl,
			completed: false,
		};

		onUpdate({
			...motivationalEarning,
			actions: [...motivationalEarning.actions, newAction],
		});

		setActionTitle("");
		setActionDescription("");
		setActionEvidenceUrl("");
		setIsAddingAction(false);
	};

	const toggleActionComplete = (actionId: string) => {
		if (!motivationalEarning) return;
		onUpdate({
			...motivationalEarning,
			actions: motivationalEarning.actions.map((a) =>
				a.id === actionId ? { ...a, completed: !a.completed } : a,
			),
		});
	};

	const deleteAction = (actionId: string) => {
		if (!motivationalEarning) return;
		onUpdate({
			...motivationalEarning,
			actions: motivationalEarning.actions.filter((a) => a.id !== actionId),
		});
	};

	return (
		<div className="bg-white rounded-3xl shadow-sm border border-royal/10 overflow-hidden">
			<div className="bg-royal/5 p-6 border-b border-royal/10">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<Target className="w-5 h-5 text-royal mr-2" />
						<h3 className="text-lg font-bold text-slate-800">
							Motivational Earning
						</h3>
					</div>
					{!isEditingGoal && motivationalEarning && (
						<button
							onClick={() => setIsEditingGoal(true)}
							className="text-royal hover:text-royal-dark text-sm font-medium"
						>
							Edit Goal
						</button>
					)}
				</div>
				<p className="text-sm text-slate-500">
					Define your dream lifestyle and create a concrete plan to achieve the
					income required.
				</p>
			</div>

			<div className="p-6">
				{isEditingGoal ? (
					<form onSubmit={handleSaveGoal} className="space-y-4">
						<div>
							<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
								Describe Your Desired Lifestyle
							</label>
							<textarea
								value={desiredLifestyle}
								onChange={(e) => setDesiredLifestyle(e.target.value)}
								placeholder="e.g., Living in a 3-bedroom house in the suburbs, traveling twice a year, and saving 20% of my income."
								className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-all h-24 resize-none text-sm"
								required
							/>
						</div>
						<div>
							<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
								Monthly Income Required
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
									{currency === "USD" ? "$" : currency}
								</span>
								<input
									type="number"
									value={requiredIncome}
									onChange={(e) => setRequiredIncome(e.target.value)}
									placeholder="0.00"
									className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-royal/50 focus:bg-white transition-all"
									required
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-3 pt-2">
							{motivationalEarning && (
								<button
									type="button"
									onClick={() => setIsEditingGoal(false)}
									className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
								>
									Cancel
								</button>
							)}
							<button
								type="submit"
								className="px-6 py-2 bg-royal text-white rounded-xl font-bold hover:bg-royal-dark transition-colors"
							>
								Save Vision
							</button>
						</div>
					</form>
				) : motivationalEarning ? (
					<div className="space-y-6">
						<div className="bg-royal/5 p-5 rounded-2xl border border-royal/10">
							<h4 className="font-bold text-slate-800 mb-2">The Vision</h4>
							<p className="text-sm text-slate-600 italic mb-4">
								"{motivationalEarning.desiredLifestyle}"
							</p>
							<div className="flex items-center justify-between border-t border-royal/10 pt-4">
								<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
									Target Monthly Income
								</span>
								<span className="text-xl font-bold text-royal">
									{formatCurrency(motivationalEarning.requiredIncome, currency)}
								</span>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-bold text-slate-800">Action Plan</h4>
								<button
									onClick={() => setIsAddingAction(true)}
									className="text-xs font-bold text-royal hover:text-royal-dark flex items-center"
								>
									<Plus className="w-3 h-3 mr-1" /> Add Action
								</button>
							</div>

							{isAddingAction && (
								<form
									onSubmit={handleAddAction}
									className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 space-y-3"
								>
									<input
										type="text"
										value={actionTitle}
										onChange={(e) => setActionTitle(e.target.value)}
										placeholder="Action Title (e.g., Complete AWS Certification)"
										className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/50"
										required
									/>
									<textarea
										value={actionDescription}
										onChange={(e) => setActionDescription(e.target.value)}
										placeholder="How will this help increase your income?"
										className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-royal/50"
										required
									/>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<LinkIcon className="h-4 w-4 text-slate-400" />
										</div>
										<input
											type="url"
											value={actionEvidenceUrl}
											onChange={(e) => setActionEvidenceUrl(e.target.value)}
											placeholder="Link to evidence (Course, Job Post, etc.)"
											className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/50"
										/>
									</div>
									<div className="flex justify-end space-x-2 pt-2">
										<button
											type="button"
											onClick={() => setIsAddingAction(false)}
											className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
										>
											Cancel
										</button>
										<button
											type="submit"
											className="px-4 py-1.5 bg-royal text-white rounded-lg text-xs font-bold hover:bg-royal-dark transition-colors"
										>
											Add
										</button>
									</div>
								</form>
							)}

							{motivationalEarning.actions.length === 0 && !isAddingAction ? (
								<div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
									<p className="text-sm text-slate-500 mb-2">
										No actions planned yet.
									</p>
									<p className="text-xs text-slate-400">
										Add steps like acquiring new skills, negotiating a raise, or
										starting a side hustle.
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{motivationalEarning.actions.map((action) => (
										<div
											key={action.id}
											className={`p-4 rounded-2xl border transition-all ${action.completed ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-royal/20 shadow-sm"}`}
										>
											<div className="flex items-start">
												<button
													onClick={() => toggleActionComplete(action.id)}
													className="mt-0.5 mr-3 flex-shrink-0 text-royal hover:text-royal-dark transition-colors"
												>
													{action.completed ? (
														<CheckCircle2 className="w-5 h-5" />
													) : (
														<Circle className="w-5 h-5" />
													)}
												</button>
												<div className="flex-1 min-w-0">
													<h5
														className={`font-bold text-sm ${action.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
													>
														{action.title}
													</h5>
													<p className="text-xs text-slate-500 mt-1 mb-2">
														{action.description}
													</p>

													{action.evidenceUrl && (
														<a
															href={action.evidenceUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center text-[10px] font-bold text-royal bg-royal/10 px-2 py-1 rounded-md hover:bg-royal/20 transition-colors"
														>
															<LinkIcon className="w-3 h-3 mr-1" /> View
															Evidence
														</a>
													)}
												</div>
												<button
													onClick={() => deleteAction(action.id)}
													className="ml-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

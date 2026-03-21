import {
	ArrowLeft,
	ChevronRight,
	Database,
	RefreshCw,
	Settings,
	User,
} from "lucide-react";
import { useState } from "react";
import { AccountSettings } from "./components/AccountSettings";
import { CategoriesSettings } from "./components/CategoriesSettings";
import { DataSettings } from "./components/DataSettings";
import { RecurringSettings } from "./components/RecurringSettings";
import type { SettingsViewProps } from "./types";

export function SettingsView({
	state,
	onAddCategory,
	onUpdateCategory,
	onDeleteCategory,
	onSetCurrency,
	onUpdateRecurringTransaction,
	onDeleteRecurringTransaction,
	onImport,
	onClear,
}: SettingsViewProps) {
	const [activePage, setActivePage] = useState<
		"main" | "categories" | "account" | "data" | "recurring"
	>("main");

	if (activePage === "categories") {
		return (
			<div className="space-y-4">
				<button
					onClick={() => setActivePage("main")}
					className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
				>
					<ArrowLeft className="w-5 h-5 mr-1" /> Back to Settings
				</button>
				<CategoriesSettings
					categories={state.categories}
					onAddCategory={onAddCategory}
					onUpdateCategory={onUpdateCategory}
					onDeleteCategory={onDeleteCategory}
				/>
			</div>
		);
	}

	if (activePage === "account") {
		return (
			<div className="space-y-4">
				<button
					onClick={() => setActivePage("main")}
					className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
				>
					<ArrowLeft className="w-5 h-5 mr-1" /> Back to Settings
				</button>
				<AccountSettings
					currency={state.currency}
					onSetCurrency={onSetCurrency}
					onClear={onClear}
				/>
			</div>
		);
	}

	if (activePage === "data") {
		return (
			<div className="space-y-4">
				<button
					onClick={() => setActivePage("main")}
					className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
				>
					<ArrowLeft className="w-5 h-5 mr-1" /> Back to Settings
				</button>
				<DataSettings state={state} onImport={onImport} />
			</div>
		);
	}

	if (activePage === "recurring") {
		return (
			<div className="space-y-4">
				<button
					onClick={() => setActivePage("main")}
					className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
				>
					<ArrowLeft className="w-5 h-5 mr-1" /> Back to Settings
				</button>
				<RecurringSettings
					recurringTransactions={state.recurringTransactions || []}
					categories={state.categories}
					wallets={state.wallets}
					currency={state.currency}
					onUpdate={onUpdateRecurringTransaction}
					onDelete={onDeleteRecurringTransaction}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
				<h2 className="text-lg font-medium mb-2">Settings</h2>
				<p className="text-slate-300 text-sm leading-relaxed">
					Manage your categories, export/import data, and control your account.
				</p>
			</div>

			<div className="space-y-4">
				<button
					onClick={() => setActivePage("account")}
					className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
				>
					<div className="flex items-center">
						<div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mr-4">
							<User className="w-5 h-5" />
						</div>
						<div className="text-left">
							<h3 className="font-medium text-slate-800">Account & Currency</h3>
							<p className="text-xs text-slate-500">
								Change currency and manage account
							</p>
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-slate-400" />
				</button>

				<button
					onClick={() => setActivePage("categories")}
					className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
				>
					<div className="flex items-center">
						<div className="w-10 h-10 bg-royal/10 text-royal rounded-full flex items-center justify-center mr-4">
							<Settings className="w-5 h-5" />
						</div>
						<div className="text-left">
							<h3 className="font-medium text-slate-800">Categories</h3>
							<p className="text-xs text-slate-500">
								Add and edit transaction categories
							</p>
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-slate-400" />
				</button>

				<button
					onClick={() => setActivePage("recurring")}
					className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
				>
					<div className="flex items-center">
						<div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-4">
							<RefreshCw className="w-5 h-5" />
						</div>
						<div className="text-left">
							<h3 className="font-medium text-slate-800">
								Recurring Transactions
							</h3>
							<p className="text-xs text-slate-500">
								Manage your automated transactions
							</p>
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-slate-400" />
				</button>

				<button
					onClick={() => setActivePage("data")}
					className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
				>
					<div className="flex items-center">
						<div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mr-4">
							<Database className="w-5 h-5" />
						</div>
						<div className="text-left">
							<h3 className="font-medium text-slate-800">Data Management</h3>
							<p className="text-xs text-slate-500">
								Import and export your data as CSV
							</p>
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-slate-400" />
				</button>
			</div>
		</div>
	);
}

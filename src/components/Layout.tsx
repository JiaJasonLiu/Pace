import { Home, Settings, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { cn } from "../lib/utils";
import type { LayoutProps } from "./types";

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
	const tabs = [
		{ id: "home", label: "Spending", icon: Home },
		{ id: "lifestyle", label: "Lifestyle", icon: TrendingUp },
		{ id: "wallets", label: "Wallets", icon: WalletIcon },
		{ id: "settings", label: "Settings", icon: Settings },
	];

	return (
		<div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-slate-50 shadow-xl">
			<main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pt-6">
				{children}
			</main>

			<nav className="z-20 w-full shrink-0 border-t border-slate-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
				<div className="flex h-16 items-center justify-around">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									"flex flex-col items-center justify-center w-full h-full transition-colors",
									isActive
										? "text-royal"
										: "text-slate-400 hover:text-slate-600",
								)}
							>
								<Icon
									className={cn("w-6 h-6 mb-1", isActive && "fill-royal/10")}
								/>
								<span className="text-[10px] font-medium uppercase tracking-wider">
									{tab.label}
								</span>
							</button>
						);
					})}
				</div>
			</nav>
		</div>
	);
}

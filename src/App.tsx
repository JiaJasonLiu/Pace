import { useState } from "react";
import {
	AppStateProvider,
	type PaceAppReady,
	usePaceApp,
} from "./db/AppStateProvider";
import { Layout } from "./components/Layout";
import { useLifestyleController } from "./pages/Lifestyle/hooks/useLifestyleController";
import { LifestyleView } from "./pages/Lifestyle/LifestyleView";
import { useSettingsController } from "./pages/Settings/hooks/useSettingsController";
import { SettingsView } from "./pages/Settings/SettingsView";
import { useSpendingController } from "./pages/Spending/hooks/useSpendingController";
import { SpendingView } from "./pages/Spending/SpendingView";
import { useWalletsController } from "./pages/Wallets/hooks/useWalletsController";
import { WalletsView } from "./pages/Wallets/WalletsView";

function AppMain({ app }: { app: PaceAppReady }) {
	const [activeTab, setActiveTab] = useState("home");
	const spending = useSpendingController(app);
	const wallets = useWalletsController(app);
	const lifestyle = useLifestyleController(app);
	const settings = useSettingsController(app);

	const renderContent = () => {
		switch (activeTab) {
			case "home":
				return <SpendingView {...spending} />;
			case "wallets":
				return <WalletsView {...wallets} />;
			case "lifestyle":
				return <LifestyleView {...lifestyle} />;
			case "settings":
				return <SettingsView {...settings} />;
			default:
				return null;
		}
	};

	return (
		<Layout activeTab={activeTab} onTabChange={setActiveTab}>
			{renderContent()}
		</Layout>
	);
}

function AppBootstrap() {
	const app = usePaceApp();

	if (app.status === "loading") {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-slate-50 text-slate-600">
				<p className="text-sm">Loading database…</p>
			</div>
		);
	}

	if (app.status === "error") {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-slate-50 p-6">
				<div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
					<p className="font-medium text-red-800">
						Could not open local database
					</p>
					<p className="mt-2 text-sm text-slate-600">{app.error.message}</p>
				</div>
			</div>
		);
	}

	return <AppMain app={app} />;
}

export default function App() {
	return (
		<AppStateProvider>
			<AppBootstrap />
		</AppStateProvider>
	);
}

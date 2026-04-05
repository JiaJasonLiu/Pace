import type {
	Category,
	LifestyleGoal,
	LifestyleSettings,
	MotivationalEarning,
	Transaction,
	Wallet,
} from "../../../types";

export interface LifestyleViewProps {
	goals: LifestyleGoal[];
	wallets: Wallet[];
	transactions: Transaction[];
	categories: Category[];
	currency: string;
	lifestyleSettings?: LifestyleSettings;
	motivationalEarning?: MotivationalEarning;
	onAddGoal: (goal: LifestyleGoal) => void;
	onUpdateGoal: (goal: LifestyleGoal) => void;
	onDeleteGoal: (id: string) => void;
	onUpdateLifestyleSettings: (settings: LifestyleSettings) => void;
	onUpdateMotivationalEarning: (
		motivationalEarning: MotivationalEarning,
	) => void;
	onAddTransaction: (t: Transaction) => void;
}

export interface MotivationalEarningSectionProps {
	motivationalEarning?: MotivationalEarning;
	currency: string;
	onUpdate: (data: MotivationalEarning) => void;
}

export interface GoalModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddGoal: (goal: LifestyleGoal) => void;
	onUpdateGoal: (goal: LifestyleGoal) => void;
	editingGoal: LifestyleGoal | null;
	currency: string;
	wallets: Wallet[];
	selectedCategory: "need" | "want" | "savings" | null;
	categories: Category[];
}

export interface LifestyleSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	lifestyleSettings?: LifestyleSettings;
	onUpdateLifestyleSettings: (settings: LifestyleSettings) => void;
	currency: string;
	defaultWallet?: Wallet;
}

export interface LogTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddTransaction: (t: Transaction) => void;
	categories: Category[];
	wallets: Wallet[];
	currency: string;
	initialType?: "need" | "want" | "savings" | "income";
}

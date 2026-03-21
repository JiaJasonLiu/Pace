import type {
	AppState,
	Category,
	RecurringTransaction,
	Wallet,
} from "../../../types";

export interface SettingsViewProps {
	state: AppState;
	onAddCategory: (c: Category) => void;
	onUpdateCategory: (c: Category) => void;
	onDeleteCategory: (id: string) => void;
	onSetCurrency: (c: string) => void;
	onUpdateRecurringTransaction: (r: any) => void;
	onDeleteRecurringTransaction: (id: string) => void;
	onImport: (data: Partial<AppState>) => void;
	onClear: () => void;
}

export interface CategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (category: Category) => void;
	onDelete?: (id: string) => void;
	editingCategory: Category | null;
	categories: Category[];
}

export interface CategoriesSettingsProps {
	categories: Category[];
	onAddCategory: (c: Category) => void;
	onUpdateCategory: (c: Category) => void;
	onDeleteCategory: (id: string) => void;
}

export interface DataSettingsProps {
	state: AppState;
	onImport: (data: Partial<AppState>) => void;
}

export interface AccountSettingsProps {
	currency: string;
	onSetCurrency: (c: string) => void;
	onClear: () => void;
}

export interface RecurringSettingsProps {
	recurringTransactions: RecurringTransaction[];
	categories: Category[];
	wallets: Wallet[];
	currency: string;
	onUpdate: (r: RecurringTransaction) => void;
	onDelete: (id: string) => void;
}

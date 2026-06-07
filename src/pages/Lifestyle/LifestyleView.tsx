import { useState } from "react";
import {
    Heart,
    Info,
    PiggyBank,
    Settings,
    ShieldCheck,
    Trophy,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { FloatingAddButton } from "../../components/FloatingAddButton";
import { formatCurrency } from "../../lib/utils";
import { useLifestyleData } from "./hooks/useLifestyleData";
import { useLifestyleNavigation } from "./hooks/useLifestyleNavigation";
import { useLifestyleModals } from "./hooks/useLifestyleModals";
import { MonthSelector } from "./components/MonthSelector";
import { CategoryHeader } from "./components/CategoryHeader";
import { CategoryGoalsSection } from "./components/CategoryGoalsSection";
import { OverviewSection } from "./components/OverviewSection";
import { GoalModal } from "./components/GoalModal";
import { LifestyleSettingsModal } from "./components/LifestyleSettingsModal";
import { LogTransactionModal } from "./components/LogTransactionModal";
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
    const {
        currentDate,
        direction,
        handlePrevMonth,
        handleNextMonth,
    } = useLifestyleNavigation();

    const {
        isAdding,
        setIsAdding,
        isSettingsOpen,
        setIsSettingsOpen,
        isLoggingTransaction,
        setIsLoggingTransaction,
        editingGoal,
        setEditingGoal,
    } = useLifestyleModals();

    const [selectedCategory, setSelectedCategory] = useState<
        "need" | "want" | "savings" | null
    >(null);
    const [tLifestyleType] = useState<"need" | "want" | "savings" | "income">(
        "need",
    );

    const data = useLifestyleData({
        goals,
        wallets,
        transactions,
        categories,
        lifestyleSettings,
        currentDate,
    });

    const monthSwipeHandlers = useSwipeable({
        onSwipedLeft: () => handleNextMonth(),
        onSwipedRight: () => handlePrevMonth(),
        trackMouse: true,
    });

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "need": return "text-royal";
            case "want": return "text-notion-blue";
            case "savings": return "text-notion-green";
            default: return "text-slate-600";
        }
    };

    const getCategoryBg = (cat: string) => {
        switch (cat) {
            case "need": return "bg-royal-light";
            case "want": return "bg-notion-blue-light";
            case "savings": return "bg-notion-green-light";
            default: return "bg-slate-100";
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "need": return <ShieldCheck className="w-4 h-4" />;
            case "want": return <Heart className="w-4 h-4" />;
            case "savings": return <PiggyBank className="w-4 h-4" />;
            default: return null;
        }
    };

    const defaultWallet = wallets.find((w) => w.isDefault);

    return (
        <div className="relative min-h-full pb-20 overflow-hidden">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-royal text-white p-6 rounded-3xl shadow-xl shadow-royal/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center">
                            <Trophy className="w-6 h-6 text-gold mr-2" />
                            <h2 className="text-xl font-bold">Lifestyle Blueprint</h2>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-light">
                            {formatCurrency(data.totalRemaining, currency)}
                        </p>
                    </div>
                </div>

                {!selectedCategory && (
                    <MonthSelector
                        currentDate={currentDate}
                        direction={direction}
                        handlePrevMonth={handlePrevMonth}
                        handleNextMonth={handleNextMonth}
                        monthSwipeHandlers={monthSwipeHandlers}
                    />
                )}

                {selectedCategory ? (
                    <div className="space-y-6">
                        <CategoryHeader
                            selectedCategory={selectedCategory}
                            getCategoryBg={getCategoryBg}
                            getCategoryColor={getCategoryColor}
                            getCategoryIcon={getCategoryIcon}
                            ruleTargets={data.ruleTargets}
                            currency={currency}
                            setSelectedCategory={setSelectedCategory}
                        />
                        <CategoryGoalsSection
                            selectedCategory={selectedCategory}
                            goals={goals}
                            transactions={transactions}
                            categories={categories}
                            currency={currency}
                            currentDate={currentDate}
                            ruleTargets={data.ruleTargets}
                            actualSpending={data.actualSpending}
                            onEditGoal={(goal) => {
                                setEditingGoal(goal);
                                setIsAdding(true);
                            }}
                            onDeleteGoal={onDeleteGoal}
                            onOpenAdd={() => {
                                setEditingGoal(null);
                                setIsAdding(true);
                            }}
                        />
                    </div>
                ) : data.totalMonthlyIncome === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-notion-green-light rounded-2xl flex items-center justify-center mb-4">
                            <Info className="w-6 h-6 text-notion-green" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Set Your Lifestyle Income</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs">To calculate your monthly targets, we need to know your monthly budget.</p>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="px-6 py-3 bg-notion-green text-white rounded-2xl font-bold hover:bg-notion-green-dark transition-colors shadow-lg shadow-notion-green/20"
                        >
                            Configure Income Source
                        </button>
                    </div>
                ) : (
                    <OverviewSection
                        data={data}
                        currency={currency}
                        setSelectedCategory={setSelectedCategory}
                    />
                )}
            </div>

            {lifestyleSettings && (
                <FloatingAddButton
                    variant="slate"
                    onClick={() => {
                        setEditingGoal(null);
                        setIsAdding(true);
                    }}
                    aria-label="Add lifestyle goal"
                />
            )}

            <GoalModal
                isOpen={isAdding}
                onClose={() => {
                    setIsAdding(false);
                    setEditingGoal(null);
                }}
                onAddGoal={onAddGoal}
                onUpdateGoal={onUpdateGoal}
                editingGoal={editingGoal}
                currency={currency}
                wallets={wallets}
                selectedCategory={selectedCategory}
                categories={categories}
            />
            <LogTransactionModal
                isOpen={isLoggingTransaction}
                onClose={() => setIsLoggingTransaction(false)}
                onAddTransaction={(t) => { onAddTransaction(t); setIsLoggingTransaction(false); }}
                currency={currency}
                categories={categories}
                wallets={wallets}
                initialType={tLifestyleType}
            />
            <LifestyleSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onUpdateLifestyleSettings={onUpdateLifestyleSettings}
                currency={currency}
                defaultWallet={defaultWallet}
                lifestyleSettings={lifestyleSettings}
                motivationalEarning={motivationalEarning}
                onUpdateMotivationalEarning={onUpdateMotivationalEarning}
            />
        </div>
    );
}

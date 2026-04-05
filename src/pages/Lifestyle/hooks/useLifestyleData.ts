import { isSameMonth, parseISO } from "date-fns";
import { useMemo } from "react";
import type { 
    LifestyleGoal, 
    Transaction, 
    Wallet, 
    Category, 
    LifestyleSettings 
} from "../../../types";

interface UseLifestyleDataProps {
    goals: LifestyleGoal[];
    wallets: Wallet[];
    transactions: Transaction[];
    categories: Category[];
    lifestyleSettings?: LifestyleSettings | null;
    currentDate: Date;
}

export function useLifestyleData({
    goals,
    wallets,
    transactions,
    categories,
    lifestyleSettings,
    currentDate,
}: UseLifestyleDataProps) {
    const currentPercentages = useMemo(() => 
        lifestyleSettings?.percentages || { need: 50, want: 30, savings: 20 },
        [lifestyleSettings]
    );

    const totalMonthlyIncome = useMemo(() => {
        const defaultWallet = wallets.find((w) => w.isDefault);
        const monthlyIncomeTransactions = transactions.filter(
            (t) => t.type === "income" && isSameMonth(parseISO(t.date), currentDate),
        );
        const actualMonthlyIncome = monthlyIncomeTransactions.reduce(
            (acc, t) => acc + t.amount,
            0,
        );

        return lifestyleSettings?.incomeSource === "custom"
            ? lifestyleSettings.customIncomeAmount || 0
            : defaultWallet?.monthlyIncome || actualMonthlyIncome || 0;
    }, [wallets, transactions, lifestyleSettings, currentDate]);

    const calculateMonthlyRequirement = (goal: LifestyleGoal) => {
        return goal.targetAmount;
    };

    const totals = useMemo(() => ({
        need: goals
            .filter((g) => g.category === "need")
            .reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
        want: goals
            .filter((g) => g.category === "want")
            .reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
        savings: goals
            .filter((g) => g.category === "savings")
            .reduce((acc, g) => acc + calculateMonthlyRequirement(g), 0),
    }), [goals]);

    const ruleTargets = useMemo(() => ({
        need: totalMonthlyIncome * (currentPercentages.need / 100),
        want: totalMonthlyIncome * (currentPercentages.want / 100),
        savings: totalMonthlyIncome * (currentPercentages.savings / 100),
    }), [totalMonthlyIncome, currentPercentages]);

    const actualSpending = useMemo(() => {
        const monthlyTransactions = transactions.filter((t) =>
            isSameMonth(parseISO(t.date), currentDate),
        );

        const getSpendingForType = (type: "need" | "want" | "savings") => {
            return monthlyTransactions.reduce((acc, t) => {
                const cat = categories.find((c) => c.name === t.category);
                if (cat?.lifestyleType === type) {
                    return acc + t.amount;
                }
                return acc;
            }, 0);
        };

        return {
            need: getSpendingForType("need"),
            want: getSpendingForType("want"),
            savings: getSpendingForType("savings"),
        };
    }, [transactions, categories, currentDate]);

    const totalRemaining = useMemo(() => 
        Math.max(0, ruleTargets.need - actualSpending.need) +
        Math.max(0, ruleTargets.want - actualSpending.want) +
        Math.max(0, ruleTargets.savings - actualSpending.savings),
        [ruleTargets, actualSpending]
    );

    return {
        totalMonthlyIncome,
        currentPercentages,
        ruleTargets,
        actualSpending,
        totalRemaining,
        totals,
    };
}

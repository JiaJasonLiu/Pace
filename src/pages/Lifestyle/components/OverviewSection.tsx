import { formatCurrency } from "../../../lib/utils";
import { ShieldCheck, Heart, PiggyBank } from "lucide-react";

interface OverviewSectionProps {
    data: any;
    currency: string;
    setSelectedCategory: (cat: "need" | "want" | "savings") => void;
}

export function OverviewSection({ data, currency, setSelectedCategory }: OverviewSectionProps) {
    const getCategoryIcon = (cat: "need" | "want" | "savings") => {
        switch (cat) {
            case "need": return <ShieldCheck className="w-4 h-4" />;
            case "want": return <Heart className="w-4 h-4" />;
            case "savings": return <PiggyBank className="w-4 h-4" />;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { label: `Needs (${data.currentPercentages.need}%)`, key: "need", target: data.ruleTargets.need, current: data.actualSpending.need, remaining: data.ruleTargets.need - data.actualSpending.need, color: "royal" },
                { label: `Wants (${data.currentPercentages.want}%)`, key: "want", target: data.ruleTargets.want, current: data.actualSpending.want, remaining: data.ruleTargets.want - data.actualSpending.want, color: "notion-blue" },
                { label: `Savings (${data.currentPercentages.savings}%)`, key: "savings", target: data.ruleTargets.savings, current: data.actualSpending.savings, remaining: data.ruleTargets.savings - data.actualSpending.savings, color: "notion-green" },
            ].map((item) => (
                <button
                    key={item.key}
                    onClick={() => setSelectedCategory(item.key as any)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-left hover:border-royal/30 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <div className={`text-${item.color}`}>{getCategoryIcon(item.key as any)}</div>
                    </div>
                    <p className={`text-xl font-bold ${item.key !== "savings" && item.remaining < 0 ? "text-rose-500" : `text-${item.color}`}`}>
                        {item.key === "savings" && item.remaining < 0
                            ? `+${formatCurrency(Math.abs(item.remaining), currency)}`
                            : formatCurrency(item.remaining, currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                        {item.key === "savings" ? item.remaining < 0 ? "Surplus" : "Remaining goal" : "Remaining limit"}
                    </p>

                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${item.key === "need" ? "bg-royal" : item.key === "want" ? "bg-notion-blue" : "bg-notion-green"} transition-all duration-500`}
                            style={{ width: `${Math.max(0, Math.min(100, item.key === "savings" ? (item.current / item.target) * 100 : 100 - (item.current / item.target) * 100))}%` }}
                        ></div>
                    </div>
                </button>
            ))}
        </div>
    );
}

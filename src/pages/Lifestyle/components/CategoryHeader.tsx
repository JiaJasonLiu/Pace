import React from "react";
import { ChevronLeft } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

interface CategoryHeaderProps {
    selectedCategory: "need" | "want" | "savings";
    getCategoryBg: (cat: "need" | "want" | "savings") => string;
    getCategoryColor: (cat: "need" | "want" | "savings") => string;
    getCategoryIcon: (cat: "need" | "want" | "savings") => React.ReactNode;
    ruleTargets: { need: number; want: number; savings: number };
    currency: string;
    setSelectedCategory: (category: null) => void;
}

export function CategoryHeader({
    selectedCategory,
    getCategoryBg,
    getCategoryColor,
    getCategoryIcon,
    ruleTargets,
    currency,
    setSelectedCategory,
}: CategoryHeaderProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm font-bold">Back to Blueprint</span>
                </button>
                <div
                    className={`px-3 py-1 rounded-full ${getCategoryBg(selectedCategory)} ${getCategoryColor(selectedCategory)} text-[10px] font-bold uppercase tracking-widest`}
                >
                    {selectedCategory}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div
                    className={`w-12 h-12 rounded-2xl ${getCategoryBg(selectedCategory)} ${getCategoryColor(selectedCategory)} flex items-center justify-center`}
                >
                    {getCategoryIcon(selectedCategory)}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 capitalize">
                        {selectedCategory}s
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                        {selectedCategory === "savings" ? "Goal" : "Monthly Limit"}:{" "}
                        {formatCurrency(ruleTargets[selectedCategory], currency)}
                    </p>
                </div>
            </div>
        </div>
    );
}

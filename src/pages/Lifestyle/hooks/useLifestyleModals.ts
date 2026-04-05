import { useState } from "react";
import type { LifestyleGoal } from "../../../types";

export function useLifestyleModals() {
    const [isAdding, setIsAdding] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoggingTransaction, setIsLoggingTransaction] = useState(false);
    const [editingGoal, setEditingGoal] = useState<LifestyleGoal | null>(null);

    return {
        isAdding,
        setIsAdding,
        isSettingsOpen,
        setIsSettingsOpen,
        isLoggingTransaction,
        setIsLoggingTransaction,
        editingGoal,
        setEditingGoal,
    };
}

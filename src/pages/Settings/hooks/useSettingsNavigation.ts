import { useState } from "react";

export function useSettingsNavigation() {
    const [activePage, setActivePage] = useState<
        "main" | "categories" | "account" | "data" | "recurring" | "motivational"
    >("main");

    const navigateTo = (page: "main" | "categories" | "account" | "data" | "recurring" | "motivational") => {
        setActivePage(page);
    };

    return {
        activePage,
        navigateTo,
    };
}

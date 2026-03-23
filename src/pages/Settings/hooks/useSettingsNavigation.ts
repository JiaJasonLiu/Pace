import { useState } from "react";

export function useSettingsNavigation() {
    const [activePage, setActivePage] = useState<
        "main" | "categories" | "account" | "data" | "recurring"
    >("main");

    const navigateTo = (page: "main" | "categories" | "account" | "data" | "recurring") => {
        setActivePage(page);
    };

    return {
        activePage,
        navigateTo,
    };
}

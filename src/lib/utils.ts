import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TransactionType } from "../types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency: string = "USD") => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
	}).format(amount);
};

export const getCategoryColors = (
	lifestyleType: string | undefined,
	type: TransactionType,
) => {
	if (type === "income") return "bg-notion-green-light text-notion-green";
	switch (lifestyleType) {
		case "need":
			return "bg-royal-light text-royal";
		case "want":
			return "bg-notion-blue-light text-notion-blue";
		case "savings":
			return "bg-notion-green-light text-notion-green";
		default:
			return "bg-slate-100 text-slate-500";
	}
};

export const getLifestyleColor = (lifestyleType: string | undefined) => {
	switch (lifestyleType) {
		case "need":
			return "royal";
		case "want":
			return "notion-blue";
		case "savings":
			return "notion-green";
		default:
			return "slate-400";
	}
};

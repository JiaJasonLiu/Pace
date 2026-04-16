import { isAfter, parseISO, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { RecurrenceType, TransactionType } from "../types";
import type { TransactionModalProps } from "../components/types";

export function formatAmountWithCommas(value: string): string {
	const [integer, decimal] = value.split(".");
	const formattedInteger = (integer ?? "").replace(
		/\B(?=(\d{3})+(?!\d))/g,
		",",
	);
	return decimal !== undefined
		? `${formattedInteger}.${decimal}`
		: formattedInteger;
}

export function useTransactionForm({
	isOpen,
	onClose,
	onSave,
	initialData,
	categories,
	wallets,
}: Pick<TransactionModalProps, "isOpen" | "onClose" | "onSave" | "initialData" | "categories" | "wallets">) {
	const [amount, setAmount] = useState("");
	const [displayAmount, setDisplayAmount] = useState("");
	const [type, setType] = useState<TransactionType>("expense");
	const [category, setCategory] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [walletId, setWalletId] = useState("");
	const [recurrence, setRecurrence] = useState<RecurrenceType | "none">("none");
	const [status, setStatus] = useState<"posted" | "scheduled">("posted");
	const [isFixedCost, setIsFixedCost] = useState(false);

	const amountInputRef = useRef<HTMLInputElement>(null);

	const expenseCategories = useMemo(
		() => categories.filter((c) => c.type === "expense"),
		[categories],
	);
	const incomeCategories = useMemo(
		() => categories.filter((c) => c.type === "income"),
		[categories],
	);

	const isFutureDate = isAfter(parseISO(date), startOfDay(new Date()));

	const statusRef = useRef(status);
	statusRef.current = status;

	useEffect(() => {
		if (!isFutureDate && statusRef.current === "scheduled") {
			setStatus("posted");
		}
	}, [isFutureDate]);

	const formSessionKey = !isOpen
		? null
		: initialData?.id ?? ("new" as const);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset only on open or `formSessionKey` change. Listing categories/wallets/initialData re-runs every parent render and cleared the amount while typing.
	useEffect(() => {
		if (!isOpen || formSessionKey === null) return;

		if (initialData) {
			setAmount(initialData.amount?.toString() || "");
			setDisplayAmount(
				formatAmountWithCommas(initialData.amount?.toString() || ""),
			);
			setType(initialData.type || "expense");
			setCategory(
				initialData.category ||
					(initialData.type === "income"
						? incomeCategories[0]?.name
						: expenseCategories[0]?.name) ||
					"",
			);
			setDescription(initialData.description || "");
			setDate(
				initialData.date
					? initialData.date.split("T")[0]
					: new Date().toISOString().split("T")[0],
			);
			setWalletId(
				initialData.walletId ||
					wallets.find((w) => w.isDefault)?.id ||
					wallets[0]?.id ||
					"",
			);
			setRecurrence(initialData.recurrence || "none");
			setStatus(initialData.status || "posted");
			setIsFixedCost(initialData.isFixedCost || false);
		} else {
			setAmount("");
			setDisplayAmount("");
			setType("expense");
			setCategory(expenseCategories[0]?.name || "");
			setDescription("");
			setDate(new Date().toISOString().split("T")[0]);
			setWalletId(
				wallets.find((w) => w.isDefault)?.id || wallets[0]?.id || "",
			);
			setRecurrence("none");
			setStatus("posted");
			setIsFixedCost(false);
		}
	}, [isOpen, formSessionKey]);

	const handleTypeChange = (newType: TransactionType) => {
		setType(newType);
		const cats = newType === "expense" ? expenseCategories : incomeCategories;
		if (!cats.find((c) => c.name === category)) {
			setCategory(cats[0]?.name || "");
		}
	};

	const handleAmountChange = (value: string) => {
		const rawValue = value.replace(/,/g, "");
		if (!/^\d*\.?\d*$/.test(rawValue)) return;
		const digitsOnly = rawValue.replace(".", "");
		if (digitsOnly.length > 12) return;
		setAmount(rawValue);
		setDisplayAmount(formatAmountWithCommas(rawValue));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!amount || Number.isNaN(Number(amount))) return;
		if (!walletId) return;

		onSave({
			amount: Number(amount),
			type,
			category,
			description,
			date: new Date(date).toISOString(),
			walletId,
			recurrence,
			status,
			isFixedCost,
		});
		onClose();
	};

	return {
		displayAmount,
		type,
		category,
		setCategory,
		description,
		setDescription,
		date,
		setDate,
		walletId,
		setWalletId,
		recurrence,
		setRecurrence,
		status,
		setStatus,
		isFixedCost,
		setIsFixedCost,
		isFutureDate,
		expenseCategories,
		incomeCategories,
		amountInputRef,
		handleTypeChange,
		handleAmountChange,
		handleSubmit,
	};
}

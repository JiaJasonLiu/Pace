import { ChevronDown } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

export type SheetSelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

type SheetSelectProps = {
	value: string;
	onChange: (value: string) => void;
	options: SheetSelectOption[];
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	id?: string;
	"aria-label"?: string;
};

const MENU_Z = 100;

export function SheetSelect({
	value,
	onChange,
	options,
	placeholder = "Select…",
	className = "",
	disabled = false,
	id,
	"aria-label": ariaLabel,
}: SheetSelectProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [menuBox, setMenuBox] = useState<{
		left: number;
		top: number;
		width: number;
		maxHeight: number;
	} | null>(null);

	const updatePosition = useCallback(() => {
		const trigger = triggerRef.current;
		if (!trigger || !open) return;

		const rect = trigger.getBoundingClientRect();
		const vh = window.innerHeight;
		const vw = window.innerWidth;
		const padding = 8;
		const gap = 4;
		const width = Math.min(rect.width, vw - padding * 2);
		const left = Math.min(
			Math.max(padding, rect.left),
			vw - width - padding,
		);

		const spaceBelow = vh - rect.bottom - padding;
		const spaceAbove = rect.top - padding;
		const preferredMax = 280;
		let top = rect.bottom + gap;
		let maxHeight = Math.min(preferredMax, spaceBelow - gap);

		if (maxHeight < 120 && spaceAbove > spaceBelow) {
			const h = Math.min(preferredMax, spaceAbove - gap);
			top = rect.top - h - gap;
			maxHeight = h;
		}

		maxHeight = Math.max(120, maxHeight);

		setMenuBox({ left, top, width, maxHeight });
	}, [open]);

	useLayoutEffect(() => {
		if (!open) {
			setMenuBox(null);
			return;
		}
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) return;
		const onScrollOrResize = () => updatePosition();
		window.addEventListener("resize", onScrollOrResize);
		window.addEventListener("scroll", onScrollOrResize, true);
		return () => {
			window.removeEventListener("resize", onScrollOrResize);
			window.removeEventListener("scroll", onScrollOrResize, true);
		};
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) return;
		const closeIfOutside = (e: MouseEvent | TouchEvent) => {
			const t = e.target as Node;
			if (triggerRef.current?.contains(t)) return;
			if (menuRef.current?.contains(t)) return;
			setOpen(false);
		};
		document.addEventListener("mousedown", closeIfOutside, true);
		document.addEventListener("touchstart", closeIfOutside, true);
		return () => {
			document.removeEventListener("mousedown", closeIfOutside, true);
			document.removeEventListener("touchstart", closeIfOutside, true);
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	const selected = options.find((o) => o.value === value);
	const label = selected?.label ?? placeholder;

	const menu =
		open && menuBox
			? createPortal(
					<div
						ref={menuRef}
						role="listbox"
						className="fixed rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10 overflow-y-auto overscroll-contain"
						style={{
							zIndex: MENU_Z,
							left: menuBox.left,
							top: menuBox.top,
							width: menuBox.width,
							maxHeight: menuBox.maxHeight,
						}}
					>
						{options.map((opt) => {
							const isActive = opt.value === value;
							return (
								<button
									key={opt.value}
									type="button"
									role="option"
									aria-selected={isActive}
									disabled={opt.disabled}
									className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none ${
										isActive
											? "bg-royal/10 text-royal-dark font-medium"
											: "text-slate-700 hover:bg-slate-50"
									}`}
									onClick={() => {
										if (opt.disabled) return;
										onChange(opt.value);
										setOpen(false);
									}}
								>
									<span className="min-w-0 break-words">{opt.label}</span>
								</button>
							);
						})}
					</div>,
					document.body,
				)
			: null;

	return (
		<>
			<button
				ref={triggerRef}
				id={id}
				type="button"
				disabled={disabled}
				aria-label={ariaLabel}
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => !disabled && setOpen((o) => !o)}
				className={`flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg text-left text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-royal/40 disabled:opacity-50 ${className}`}
			>
				<span className="min-w-0 flex-1 truncate">
					{selected ? label : placeholder}
				</span>
				<ChevronDown
					className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
					aria-hidden
				/>
			</button>
			{menu}
		</>
	);
}

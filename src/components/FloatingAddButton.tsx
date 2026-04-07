import { Plus } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export type FloatingAddButtonProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"children" | "className"
> & {
	onClick: () => void;
	/** @default "royal" */
	variant?: "royal" | "slate";
	className?: string;
};

/**
 * Fixed + action above the bottom tab bar (safe-area aware).
 */
export function FloatingAddButton({
	onClick,
	variant = "royal",
	className,
	type = "button",
	...rest
}: FloatingAddButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			className={cn(
				"fixed right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 bottom-[calc(5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))]",
				variant === "royal" &&
					"bg-royal shadow-royal/30 hover:bg-royal-dark",
				variant === "slate" &&
					"bg-slate-900 shadow-slate-900/20 hover:bg-slate-800",
				className,
			)}
			{...rest}
		>
			<Plus className="h-6 w-6" aria-hidden />
		</button>
	);
}

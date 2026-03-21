import { X } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import type { ModalProps } from "./types";

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	actions,
	footer,
}: ModalProps) {
	const y = useMotionValue(0);
	const scrollRef = useRef<HTMLDivElement>(null);
	const dragInfo = useRef({
		isDragging: false,
		startY: 0,
		startTime: 0,
	});

	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		const handlePointerDown = (e: PointerEvent) => {
			// Only handle primary button (left click or touch)
			if (e.button !== 0 && e.pointerType === "mouse") return;

			const isAtTop = element.scrollTop <= 0;
			if (isAtTop) {
				dragInfo.current = {
					isDragging: true,
					startY: e.clientY,
					startTime: Date.now(),
				};
			}
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (!dragInfo.current.isDragging) return;

			const currentY = e.clientY;
			const deltaY = currentY - dragInfo.current.startY;

			// If swiping up (scrolling down the content), abort drag and let native scroll take over
			if (deltaY < 0) {
				dragInfo.current.isDragging = false;
				y.set(0);
				return;
			}

			// If swiping down and at the top, drag the modal
			if (deltaY > 0 && element.scrollTop <= 0) {
				y.set(deltaY);
			}
		};

		const handlePointerUp = (e: PointerEvent) => {
			if (!dragInfo.current.isDragging) return;

			const currentY = e.clientY;
			const deltaY = currentY - dragInfo.current.startY;
			const deltaTime = Date.now() - dragInfo.current.startTime;
			const velocity = deltaY / deltaTime;

			if (deltaY > 250 || velocity > 0.5) {
				onClose();
			} else {
				animate(y, 0, { type: "spring", damping: 25, stiffness: 300 });
			}

			dragInfo.current.isDragging = false;
		};

		element.addEventListener("pointerdown", handlePointerDown);
		element.addEventListener("pointermove", handlePointerMove);
		element.addEventListener("pointerup", handlePointerUp);
		element.addEventListener("pointercancel", handlePointerUp);

		return () => {
			element.removeEventListener("pointerdown", handlePointerDown);
			element.removeEventListener("pointermove", handlePointerMove);
			element.removeEventListener("pointerup", handlePointerUp);
			element.removeEventListener("pointercancel", handlePointerUp);
		};
	}, [onClose, y]);

	if (!isOpen) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm"
		>
			<div className="fixed inset-0" onClick={onClose} />
			<motion.div
				ref={scrollRef}
				style={{ y, touchAction: "pan-y" }}
				initial={{ y: "100%" }}
				animate={{ y: 0 }}
				exit={{ y: "100%" }}
				transition={{ type: "spring", damping: 25, stiffness: 300 }}
				className="bg-white w-full max-w-md h-[95vh] rounded-t-3xl shadow-2xl relative z-10 flex flex-col overflow-y-auto overflow-x-hidden overscroll-none"
			>
				<div className="sticky top-0 z-30 flex flex-col justify-center items-center p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
					<div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4" />
					<div className="w-full flex justify-center items-center relative">
						<div className="absolute left-1">
							<button
								type="button"
								onClick={onClose}
								className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<h3 className="text-lg font-bold text-slate-500">{title}</h3>
						<div className="absolute right-1 flex items-center space-x-2">
							{actions}
						</div>
					</div>
				</div>

				<div className="p-5 flex-1 flex flex-col">{children}</div>

				{footer && (
					<div className="sticky bottom-0 z-30 p-5 border-t border-slate-100 bg-white flex-shrink-0 mt-auto">
						{footer}
					</div>
				)}
			</motion.div>
		</motion.div>
	);
}

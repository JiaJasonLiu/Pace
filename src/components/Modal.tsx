import { X } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, type TouchEvent } from "react";
import { createPortal } from "react-dom";
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
	const sheetRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const dragInfo = useRef({
		isDragging: false,
		fromChrome: false,
		startY: 0,
		startTime: 0,
	});

	useEffect(() => {
		const sheet = sheetRef.current;
		const header = headerRef.current;
		const scroller = scrollRef.current;
		if (!sheet || !scroller) return;

		const handlePointerDown = (e: PointerEvent) => {
			if (e.button !== 0 && e.pointerType === "mouse") return;

			const fromChrome =
				header != null &&
				e.target instanceof Node &&
				header.contains(e.target);
			const isAtTop = fromChrome || scroller.scrollTop <= 0;
			if (isAtTop) {
				dragInfo.current = {
					isDragging: true,
					fromChrome,
					startY: e.clientY,
					startTime: Date.now(),
				};
			}
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (!dragInfo.current.isDragging) return;

			const currentY = e.clientY;
			const deltaY = currentY - dragInfo.current.startY;

			if (deltaY < 0) {
				dragInfo.current.isDragging = false;
				y.set(0);
				return;
			}

			if (
				deltaY > 0 &&
				(dragInfo.current.fromChrome || scroller.scrollTop <= 0)
			) {
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

		const capture = { capture: true };
		sheet.addEventListener("pointerdown", handlePointerDown, capture);
		sheet.addEventListener("pointermove", handlePointerMove, capture);
		sheet.addEventListener("pointerup", handlePointerUp, capture);
		sheet.addEventListener("pointercancel", handlePointerUp, capture);

		return () => {
			sheet.removeEventListener("pointerdown", handlePointerDown, capture);
			sheet.removeEventListener("pointermove", handlePointerMove, capture);
			sheet.removeEventListener("pointerup", handlePointerUp, capture);
			sheet.removeEventListener("pointercancel", handlePointerUp, capture);
		};
	}, [onClose, y]);

	useEffect(() => {
		if (!isOpen) return;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prevOverflow;
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const stopTouchBubble = (e: TouchEvent) => {
		e.stopPropagation();
	};

	const modalTree = (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onTouchStart={stopTouchBubble}
			onTouchMove={stopTouchBubble}
			onTouchEnd={stopTouchBubble}
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm overscroll-none"
		>
			<div className="fixed inset-0" onClick={onClose} />
			<motion.div
				ref={sheetRef}
				style={{ y }}
				initial={{ y: "100%" }}
				animate={{ y: 0 }}
				exit={{ y: "100%" }}
				transition={{ type: "spring", damping: 25, stiffness: 300 }}
				className="bg-white w-full max-w-md h-[95vh] rounded-t-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden overscroll-none"
			>
				<div
					ref={headerRef}
					className="z-30 flex flex-col justify-center items-center p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0 touch-none"
				>
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

				<div
					ref={scrollRef}
					className="p-5 flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
				>
					{children}
				</div>

				{footer && (
					<div className="z-30 p-5 border-t border-slate-100 bg-white flex-shrink-0 touch-none">
						{footer}
					</div>
				)}
			</motion.div>
		</motion.div>
	);

	return createPortal(modalTree, document.body);
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { format } from "date-fns";

interface MonthSelectorProps {
    currentDate: Date;
    direction: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    monthSwipeHandlers: any; // Type from useSwipeable, can be refined if needed
}

export function MonthSelector({
    currentDate,
    direction,
    handlePrevMonth,
    handleNextMonth,
    monthSwipeHandlers,
}: MonthSelectorProps) {
    const timestampVariants = {
        enter: (direction: number) => ({
            opacity: 0,
            x: direction * 20,
        }),
        center: {
            opacity: 1,
            x: 0,
        },
        exit: (direction: number) => ({
            opacity: 0,
            x: -direction * 20,
        }),
    };

    return (
        <div
            {...monthSwipeHandlers}
            className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 touch-pan-y"
        >
            <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-royal"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center overflow-hidden relative h-8 flex items-center justify-center w-[180px]">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.p
                        key={currentDate.toISOString()}
                        custom={direction}
                        variants={timestampVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="text-lg font-medium text-slate-800 absolute whitespace-nowrap"
                    >
                        {format(currentDate, "MMMM yyyy")}
                    </motion.p>
                </AnimatePresence>
            </div>
            <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-royal"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}

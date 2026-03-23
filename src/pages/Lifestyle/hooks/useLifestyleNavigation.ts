import { useState } from "react";

export function useLifestyleNavigation(initialDate: Date = new Date()) {
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [direction, setDirection] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const handlePrevMonth = () => {
        setDirection(-1);
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setDirection(1);
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
    };

    const handlePrevSlide = () => {
        setDirection(-1);
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : 1)); // Assuming 2 slides for now
    };

    const handleNextSlide = () => {
        setDirection(1);
        setCurrentSlideIndex((prev) => (prev < 1 ? prev + 1 : 0));
    };

    return {
        currentDate,
        direction,
        setDirection,
        currentSlideIndex,
        setCurrentSlideIndex,
        handlePrevMonth,
        handleNextMonth,
        handlePrevSlide,
        handleNextSlide,
    };
}

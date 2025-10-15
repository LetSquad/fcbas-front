import { useEffect } from "react";

interface UseEscapeToResetSelectionOptions {
    selectedRegionId: number | null;
    onReset: () => void;
}

/**
 * Слушает клавишу Escape и сбрасывает выбранный регион.
 */
export function useEscapeToResetSelection({ selectedRegionId, onReset }: UseEscapeToResetSelectionOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && selectedRegionId !== null) {
                event.preventDefault();
                onReset();
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => {
            globalThis.removeEventListener("keydown", handleKeyDown);
        };
    }, [onReset, selectedRegionId]);
}

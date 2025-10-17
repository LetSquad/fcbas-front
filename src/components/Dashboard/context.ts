import { createContext, Dispatch, SetStateAction, useContext } from "react";

import { FormData } from "@models/filters/types";

interface ExtendedModeContextValue {
    isExtendedMode: boolean;
    setIsExtendedMode: Dispatch<SetStateAction<boolean>>;
}

export const FilterFormContext = createContext<FormData | undefined>(undefined);
export const ExtendedModeContext = createContext<ExtendedModeContextValue | undefined>(undefined);

export function useFilterForm() {
    const ctx = useContext(FilterFormContext) as FormData;

    if (!ctx) {
        throw new Error("useFilterForm необходимо использовать внутри <FilterFormContext.Provider>");
    }

    return ctx;
}

export function useExtendedMode() {
    const ctx = useContext(ExtendedModeContext);

    if (!ctx) {
        throw new Error("useExtendedMode необходимо использовать внутри <ExtendedModeContext.Provider>");
    }

    return ctx;
}

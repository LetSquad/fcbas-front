import { createContext, useContext } from "react";

import { FormData } from "@models/filters/types";

export const FilterFormContext = createContext<FormData | undefined>(undefined);

export function useFilterForm() {
    const ctx = useContext(FilterFormContext) as FormData;

    if (!ctx) {
        throw new Error("useFilterForm необходимо использовать внутри <FilterFormContext.Provider>");
    }

    return ctx;
}

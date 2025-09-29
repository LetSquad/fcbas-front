import { createContext, useContext } from "react";

import { FormData } from "@models/filters/types";

export const FilterFormContext = createContext<FormData | undefined>(undefined);

export function useFilterFormContext() {
    return useContext(FilterFormContext) as FormData;
}

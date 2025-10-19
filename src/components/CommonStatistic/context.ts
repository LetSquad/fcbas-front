import { createContext, useCallback, useContext } from "react";

export interface ChartExportRegistration {
    id: string;
    title: string;
    getImage: () => Promise<Blob | null | undefined>;
    isDownloadDisabled?: boolean;
}

interface ChartsExportContextValue {
    registerChart: (chart: ChartExportRegistration) => () => void;
}

export const ChartsExportContext = createContext<ChartsExportContextValue | undefined>(undefined);

export function useRegisterChartForExport() {
    const context = useContext(ChartsExportContext);

    return useCallback(
        (chart: ChartExportRegistration) => {
            if (!context) {
                return () => undefined;
            }

            return context.registerChart(chart);
        },
        [context]
    );
}

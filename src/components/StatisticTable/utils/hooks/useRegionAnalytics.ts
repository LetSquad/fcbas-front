import { useCallback, useMemo } from "react";

import { useFilterForm } from "@components/Dashboard/context";
import { formatTableData } from "@components/StatisticTable/utils/utils";
import type { AnalyticsStatusSummary, RegionAnalyticsResult } from "@models/analytics/types";
import {
    useGetAverageCountByRegionQuery,
    useGetAverageDurationByRegionQuery,
    useGetCountByRegionQuery,
    useGetDensityByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetMaxCountByRegionQuery,
    useGetTimeDistributionByRegionQuery
} from "@store/analytics/api";
import { useGetRegionsQuery } from "@store/regions/api";

interface QueryState {
    key: string;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    refetch: () => void;
}

export function useRegionAnalytics(): RegionAnalyticsResult {
    const formData = useFilterForm();

    const { data: regions } = useGetRegionsQuery();

    const dateRangeArgs = useMemo(
        () => ({ startDate: formData.startDate, finishDate: formData.finishDate }),
        [formData.finishDate, formData.startDate]
    );

    const countByRegion = useGetCountByRegionQuery(dateRangeArgs);
    const averageDurationByRegion = useGetAverageDurationByRegionQuery(dateRangeArgs);
    const averageCountByRegion = useGetAverageCountByRegionQuery(formData);
    const emptyDaysByRegion = useGetEmptyDaysByRegionQuery(dateRangeArgs);
    const densityByRegion = useGetDensityByRegionQuery(dateRangeArgs);
    const timeDistributionByRegion = useGetTimeDistributionByRegionQuery(dateRangeArgs);
    const maxCountByRegion = useGetMaxCountByRegionQuery(formData);

    const queryStates: QueryState[] = useMemo(() => {
        const analyticsQueries = [
            { key: "countByRegion", result: countByRegion },
            { key: "averageDurationByRegion", result: averageDurationByRegion },
            { key: "averageCountByRegion", result: averageCountByRegion },
            { key: "emptyDaysByRegion", result: emptyDaysByRegion },
            { key: "densityByRegion", result: densityByRegion },
            { key: "timeDistributionByRegion", result: timeDistributionByRegion },
            { key: "maxCountByRegion", result: maxCountByRegion }
        ];

        return analyticsQueries.map(({ key, result }) => ({
            key,
            isLoading: result.isLoading || result.isFetching,
            isError: result.isError,
            isSuccess: result.isSuccess,
            refetch: result.refetch
        }));
    }, [
        averageCountByRegion,
        averageDurationByRegion,
        countByRegion,
        densityByRegion,
        emptyDaysByRegion,
        maxCountByRegion,
        timeDistributionByRegion
    ]);

    const statusSummary = useMemo<AnalyticsStatusSummary>(() => {
        let loadingCount = 0;
        let errorCount = 0;
        let successCount = 0;

        for (const query of queryStates) {
            if (query.isLoading) {
                loadingCount += 1;
            }

            if (query.isError) {
                errorCount += 1;
            }

            if (query.isSuccess) {
                successCount += 1;
            }
        }

        return {
            total: queryStates.length,
            loadingCount,
            errorCount,
            successCount,
            isLoading: loadingCount > 0,
            hasError: errorCount > 0,
            hasSuccess: successCount > 0
        };
    }, [queryStates]);

    const formattedTableData = useMemo(
        () =>
            formatTableData(
                regions,
                countByRegion.data,
                averageDurationByRegion.data,
                averageCountByRegion.data,
                emptyDaysByRegion.data,
                densityByRegion.data,
                timeDistributionByRegion.data,
                maxCountByRegion.data,
                formData.resolution
            ),
        [
            averageCountByRegion.data,
            averageDurationByRegion.data,
            countByRegion.data,
            densityByRegion.data,
            emptyDaysByRegion.data,
            formData.resolution,
            maxCountByRegion.data,
            regions,
            timeDistributionByRegion.data
        ]
    );

    const refetchErroredQueries = useCallback(() => {
        for (const query of queryStates) {
            if (query.isError) {
                query.refetch();
            }
        }
    }, [queryStates]);

    return {
        regions,
        densityPartAreaKm: densityByRegion.data?.partAreaKm,
        formattedTableData,
        statusSummary,
        refetchErroredQueries
    };
}

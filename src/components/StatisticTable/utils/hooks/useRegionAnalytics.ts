import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import { useFilterForm } from "@components/Dashboard/context";
import { formatTableData } from "@components/StatisticTable/utils/utils";
import type { AnalyticsStatusSummary, RegionAnalyticsResult } from "@models/analytics/types";
import type { RegionRecords } from "@models/regions/types";
import {
    useGetAverageCountByRegionQuery,
    useGetAverageDurationByRegionQuery,
    useGetCountByRegionQuery,
    useGetDensityByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetMaxCountByRegionQuery,
    useGetTimeDistributionByRegionQuery
} from "@store/analytics/api";
import { regionsApi } from "@store/regions/api";

interface QueryState {
    key: string;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    refetch: () => void;
}

export function useRegionAnalytics(): RegionAnalyticsResult {
    const formData = useFilterForm();
    const { data: regions } = useSelector(regionsApi.endpoints.getRegions.select()) as { data?: RegionRecords };

    const countByRegion = useGetCountByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const averageDurationByRegion = useGetAverageDurationByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const averageCountByRegion = useGetAverageCountByRegionQuery(formData);

    const emptyDaysByRegion = useGetEmptyDaysByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const densityByRegions = useGetDensityByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const timeDistributionsByRegion = useGetTimeDistributionByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const maxCountByRegion = useGetMaxCountByRegionQuery(formData);

    const queryStates: QueryState[] = useMemo(
        () => [
            {
                key: "countByRegion",
                isLoading: countByRegion.isLoading || countByRegion.isFetching,
                isError: countByRegion.isError,
                isSuccess: countByRegion.isSuccess,
                refetch: countByRegion.refetch
            },
            {
                key: "averageDurationByRegion",
                isLoading: averageDurationByRegion.isLoading || averageDurationByRegion.isFetching,
                isError: averageDurationByRegion.isError,
                isSuccess: averageDurationByRegion.isSuccess,
                refetch: averageDurationByRegion.refetch
            },
            {
                key: "averageCountByRegion",
                isLoading: averageCountByRegion.isLoading || averageCountByRegion.isFetching,
                isError: averageCountByRegion.isError,
                isSuccess: averageCountByRegion.isSuccess,
                refetch: averageCountByRegion.refetch
            },
            {
                key: "emptyDaysByRegion",
                isLoading: emptyDaysByRegion.isLoading || emptyDaysByRegion.isFetching,
                isError: emptyDaysByRegion.isError,
                isSuccess: emptyDaysByRegion.isSuccess,
                refetch: emptyDaysByRegion.refetch
            },
            {
                key: "densityByRegion",
                isLoading: densityByRegions.isLoading || densityByRegions.isFetching,
                isError: densityByRegions.isError,
                isSuccess: densityByRegions.isSuccess,
                refetch: densityByRegions.refetch
            },
            {
                key: "timeDistributionByRegion",
                isLoading: timeDistributionsByRegion.isLoading || timeDistributionsByRegion.isFetching,
                isError: timeDistributionsByRegion.isError,
                isSuccess: timeDistributionsByRegion.isSuccess,
                refetch: timeDistributionsByRegion.refetch
            },
            {
                key: "maxCountByRegion",
                isLoading: maxCountByRegion.isLoading || maxCountByRegion.isFetching,
                isError: maxCountByRegion.isError,
                isSuccess: maxCountByRegion.isSuccess,
                refetch: maxCountByRegion.refetch
            }
        ],
        [
            averageCountByRegion.isError,
            averageCountByRegion.isFetching,
            averageCountByRegion.isLoading,
            averageCountByRegion.isSuccess,
            averageCountByRegion.refetch,
            averageDurationByRegion.isError,
            averageDurationByRegion.isFetching,
            averageDurationByRegion.isLoading,
            averageDurationByRegion.isSuccess,
            averageDurationByRegion.refetch,
            countByRegion.isError,
            countByRegion.isFetching,
            countByRegion.isLoading,
            countByRegion.isSuccess,
            countByRegion.refetch,
            densityByRegions.isError,
            densityByRegions.isFetching,
            densityByRegions.isLoading,
            densityByRegions.isSuccess,
            densityByRegions.refetch,
            emptyDaysByRegion.isError,
            emptyDaysByRegion.isFetching,
            emptyDaysByRegion.isLoading,
            emptyDaysByRegion.isSuccess,
            emptyDaysByRegion.refetch,
            maxCountByRegion.isError,
            maxCountByRegion.isFetching,
            maxCountByRegion.isLoading,
            maxCountByRegion.isSuccess,
            maxCountByRegion.refetch,
            timeDistributionsByRegion.isError,
            timeDistributionsByRegion.isFetching,
            timeDistributionsByRegion.isLoading,
            timeDistributionsByRegion.isSuccess,
            timeDistributionsByRegion.refetch
        ]
    );

    const statusSummary = useMemo<AnalyticsStatusSummary>(() => {
        const loadingCount = queryStates.filter((query) => query.isLoading).length;
        const errorCount = queryStates.filter((query) => query.isError).length;
        const successCount = queryStates.filter((query) => query.isSuccess).length;

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
                densityByRegions.data,
                timeDistributionsByRegion.data,
                maxCountByRegion.data
            ),
        [
            averageCountByRegion.data,
            averageDurationByRegion.data,
            countByRegion.data,
            densityByRegions.data,
            emptyDaysByRegion.data,
            maxCountByRegion.data,
            regions,
            timeDistributionsByRegion.data
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
        densityPartAreaKm: densityByRegions.data?.partAreaKm,
        formattedTableData,
        statusSummary,
        refetchErroredQueries
    };
}

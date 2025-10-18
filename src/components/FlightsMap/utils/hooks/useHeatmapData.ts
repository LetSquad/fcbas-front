import { useMemo } from "react";

import { normalizeDomain } from "@components/FlightsMap/utils/utils";
import { HeatmapMode } from "@models/analytics/enums";
import { HeatMapInfo } from "@models/analytics/types";
import { FormData } from "@models/filters/types";
import { HeatmapDomain } from "@models/map/types";
import { RegionShape } from "@models/regions/types";
import {
    useGetAverageCountByRegionQuery,
    useGetAverageDurationByRegionQuery,
    useGetCountByRegionQuery,
    useGetDensityByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetMaxCountByRegionQuery
} from "@store/analytics/api";

interface UseHeatmapDataParams {
    formData: FormData;
    regions: Record<number, RegionShape>;
    interregionalCounts?: Record<number, number>;
}

interface UseHeatmapDataResult {
    heatmapInfoByRegion: Map<number, HeatMapInfo>;
    heatDomains: Record<HeatmapMode, HeatmapDomain>;
    queriesState: {
        isLoadingAny: boolean;
        isFetchingAny: boolean;
        errorRefetch?: () => void;
    };
}

const EMPTY_DOMAINS: Record<HeatmapMode, HeatmapDomain> = {
    [HeatmapMode.COUNT]: { min: 0, max: 0 },
    [HeatmapMode.AVERAGE_DURATION]: { min: 0, max: 0 },
    [HeatmapMode.AVERAGE_COUNT]: { min: 0, max: 0 },
    [HeatmapMode.MEDIAN_COUNT]: { min: 0, max: 0 },
    [HeatmapMode.EMPTY_DAYS_COUNT]: { min: 0, max: 0 },
    [HeatmapMode.DENSITY]: { min: 0, max: 0 },
    [HeatmapMode.MAX_COUNT]: { min: 0, max: 0 },
    [HeatmapMode.BETWEEN_REGIONS_COUNT]: { min: 0, max: 0 }
};

/**
 * Собирает и объединяет все данные для теплокарты.
 * Хук инкапсулирует набор запросов и нормализацию данных, чтобы основной компонент не занимался механической склейкой.
 */
export function useHeatmapData({ formData, regions, interregionalCounts }: UseHeatmapDataParams): UseHeatmapDataResult {
    const {
        data: countByRegions,
        isLoading: isCountByRegionsLoading,
        isFetching: isCountByRegionsFetching,
        isError: isCountByRegionsError,
        refetch: refetchCountByRegions
    } = useGetCountByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: averageDurationByRegions,
        isLoading: isAverageDurationByRegionsLoading,
        isFetching: isAverageDurationByRegionsFetching,
        isError: isAverageDurationByRegionsError,
        refetch: refetchAverageDurationByRegions
    } = useGetAverageDurationByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: averageCountByRegions,
        isLoading: isAverageCountByRegionsLoading,
        isFetching: isAverageCountByRegionsFetching,
        isError: isAverageCountByRegionsError,
        refetch: refetchAverageCountByRegions
    } = useGetAverageCountByRegionQuery(formData);

    const {
        data: emptyDaysByRegions,
        isLoading: isEmptyDaysByRegionsLoading,
        isFetching: isEmptyDaysByRegionsFetching,
        isError: isEmptyDaysByRegionsError,
        refetch: refetchEmptyDaysByRegions
    } = useGetEmptyDaysByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isFetching: isDensityByRegionsFetching,
        isError: isDensityByRegionsError,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: maxCountByRegions,
        isLoading: isMaxCountByRegionsLoading,
        isFetching: isMaxCountByRegionsFetching,
        isError: isMaxCountByRegionsError,
        refetch: refetchMaxCountByRegions
    } = useGetMaxCountByRegionQuery(formData);

    const heatmapInfoByRegion = useMemo(() => {
        const map = new Map<number, HeatMapInfo>();

        if (
            !countByRegions ||
            !averageDurationByRegions ||
            !averageCountByRegions ||
            !emptyDaysByRegions ||
            !densityByRegions ||
            !maxCountByRegions
        ) {
            return map;
        }

        for (const region of Object.values(regions)) {
            const averageCount = averageCountByRegions.regionsMap?.[region.id];

            map.set(region.id, {
                flightCount: countByRegions.regionsMap?.[region.id] ?? 0,
                averageFlightDurationSeconds: averageDurationByRegions.regionsMap?.[region.id] ?? 0,
                averageFlightCount: averageCount?.averageFlightsCount ?? 0,
                medianFlightCount: averageCount?.medianFlightsCount ?? 0,
                emptyDays: emptyDaysByRegions.regionsMap?.[region.id] ?? 0,
                density: densityByRegions.regionsMap?.[region.id] ?? 0,
                maxCount: maxCountByRegions.regionsMap?.[region.id]?.maxFlightsCount ?? 0,
                interregionalFlightCount: interregionalCounts?.[region.id] ?? 0
            });
        }

        return map;
    }, [
        averageCountByRegions,
        averageDurationByRegions,
        countByRegions,
        densityByRegions,
        emptyDaysByRegions,
        interregionalCounts,
        maxCountByRegions,
        regions
    ]);

    const heatDomains = useMemo(() => {
        if (heatmapInfoByRegion.size === 0) {
            return EMPTY_DOMAINS;
        }

        const domains: Record<HeatmapMode, HeatmapDomain> = {
            [HeatmapMode.COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.AVERAGE_DURATION]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.AVERAGE_COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.MEDIAN_COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.EMPTY_DAYS_COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.DENSITY]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.MAX_COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 },
            [HeatmapMode.BETWEEN_REGIONS_COUNT]: { min: Number.POSITIVE_INFINITY, max: 0 }
        };

        const updateDomain = (mode: HeatmapMode, value: number) => {
            const domain = domains[mode];
            domain.min = Math.min(domain.min, value);
            domain.max = Math.max(domain.max, value);
        };

        for (const info of heatmapInfoByRegion.values()) {
            updateDomain(HeatmapMode.COUNT, info.flightCount);
            updateDomain(HeatmapMode.AVERAGE_DURATION, info.averageFlightDurationSeconds);
            updateDomain(HeatmapMode.AVERAGE_COUNT, info.averageFlightCount);
            updateDomain(HeatmapMode.MEDIAN_COUNT, info.medianFlightCount);
            updateDomain(HeatmapMode.EMPTY_DAYS_COUNT, info.emptyDays);

            // Для плотности округляем до сотых, чтобы домен не «прыгал» из-за плавающей точки
            const roundedDensity = Math.round(info.density * 100) / 100;
            updateDomain(HeatmapMode.DENSITY, roundedDensity);

            updateDomain(HeatmapMode.MAX_COUNT, info.maxCount);
            updateDomain(HeatmapMode.BETWEEN_REGIONS_COUNT, info.interregionalFlightCount);
        }

        return {
            [HeatmapMode.COUNT]: normalizeDomain(domains[HeatmapMode.COUNT]),
            [HeatmapMode.AVERAGE_DURATION]: normalizeDomain(domains[HeatmapMode.AVERAGE_DURATION]),
            [HeatmapMode.AVERAGE_COUNT]: normalizeDomain(domains[HeatmapMode.AVERAGE_COUNT]),
            [HeatmapMode.MEDIAN_COUNT]: normalizeDomain(domains[HeatmapMode.MEDIAN_COUNT]),
            [HeatmapMode.EMPTY_DAYS_COUNT]: normalizeDomain(domains[HeatmapMode.EMPTY_DAYS_COUNT]),
            [HeatmapMode.DENSITY]: normalizeDomain(domains[HeatmapMode.DENSITY]),
            [HeatmapMode.MAX_COUNT]: normalizeDomain(domains[HeatmapMode.MAX_COUNT]),
            [HeatmapMode.BETWEEN_REGIONS_COUNT]: normalizeDomain(domains[HeatmapMode.BETWEEN_REGIONS_COUNT])
        };
    }, [heatmapInfoByRegion]);

    const queriesState = useMemo(() => {
        const queries = [
            {
                isLoading: isCountByRegionsLoading,
                isFetching: isCountByRegionsFetching,
                isError: isCountByRegionsError,
                refetch: refetchCountByRegions
            },
            {
                isLoading: isAverageDurationByRegionsLoading,
                isFetching: isAverageDurationByRegionsFetching,
                isError: isAverageDurationByRegionsError,
                refetch: refetchAverageDurationByRegions
            },
            {
                isLoading: isAverageCountByRegionsLoading,
                isFetching: isAverageCountByRegionsFetching,
                isError: isAverageCountByRegionsError,
                refetch: refetchAverageCountByRegions
            },
            {
                isLoading: isEmptyDaysByRegionsLoading,
                isFetching: isEmptyDaysByRegionsFetching,
                isError: isEmptyDaysByRegionsError,
                refetch: refetchEmptyDaysByRegions
            },
            {
                isLoading: isDensityByRegionsLoading,
                isFetching: isDensityByRegionsFetching,
                isError: isDensityByRegionsError,
                refetch: refetchDensityByRegions
            },
            {
                isLoading: isMaxCountByRegionsLoading,
                isFetching: isMaxCountByRegionsFetching,
                isError: isMaxCountByRegionsError,
                refetch: refetchMaxCountByRegions
            }
        ];

        const isLoadingAny = queries.some((query) => query.isLoading);
        const isFetchingAny = queries.some((query) => query.isFetching);
        const errorQuery = queries.find((query) => query.isError);

        return {
            isLoadingAny,
            isFetchingAny,
            errorRefetch: errorQuery?.refetch
        };
    }, [
        isAverageCountByRegionsError,
        isAverageCountByRegionsFetching,
        isAverageCountByRegionsLoading,
        isAverageDurationByRegionsError,
        isAverageDurationByRegionsFetching,
        isAverageDurationByRegionsLoading,
        isCountByRegionsError,
        isCountByRegionsFetching,
        isCountByRegionsLoading,
        isDensityByRegionsError,
        isDensityByRegionsFetching,
        isDensityByRegionsLoading,
        isEmptyDaysByRegionsError,
        isEmptyDaysByRegionsFetching,
        isEmptyDaysByRegionsLoading,
        isMaxCountByRegionsError,
        isMaxCountByRegionsFetching,
        isMaxCountByRegionsLoading,
        refetchAverageCountByRegions,
        refetchAverageDurationByRegions,
        refetchCountByRegions,
        refetchDensityByRegions,
        refetchEmptyDaysByRegions,
        refetchMaxCountByRegions
    ]);

    return {
        heatmapInfoByRegion,
        heatDomains,
        queriesState
    };
}

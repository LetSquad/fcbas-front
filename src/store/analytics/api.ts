import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@api/api";
import apiUrls from "@api/apiUrls";
import {
    AnalyticsBaseQueryParams,
    AnalyticsDensityResolutionQueryParams,
    AnalyticsRegionsQueryParams,
    AnalyticsRegionsResolutionQueryParams,
    AnalyticsResolutionQueryParams,
    AverageCount,
    AverageCountByRegion,
    AverageCountByRegionMap,
    AverageCountInfo,
    AverageDuration,
    AverageDurationByRegion,
    AverageDurationByRegionMap,
    Count,
    CountByRegion,
    CountByRegionMap,
    DensityByRegion,
    DensityByRegionMap,
    EmptyDaysByRegion,
    EmptyDaysByRegionMap,
    FlightBetweenRegions,
    FlightsBetweenRegions,
    FlightsBetweenRegionsFormatted,
    MaxCount,
    MaxCountByRegion,
    MaxCountByRegionMap,
    MaxCountInfo,
    TimeDistribution,
    TimeDistributionByRegion,
    TimeDistributionByRegionMap,
    TimeDistributionInfo,
    Trend,
    TrendByRegion,
    TrendByRegionMap,
    TrendPeriod
} from "@models/analytics/types";

if (process.env.WITH_MOCK) {
    await import("@mocks/analytics/mock").then((m) => m.setupAnalyticsMocks());
}

export const analyticsApi = createApi({
    reducerPath: "analyticsApi",
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        getTrend: build.query<Trend, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.trend(), params: queryParams })
        }),
        getTrendByRegion: build.query<TrendByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.trendByRegion(), params: queryParams }),
            transformResponse: (response: TrendByRegion) => {
                const map = new Map<number, TrendPeriod[]>();

                for (const { regionId, periods } of response.regions) {
                    map.set(regionId, periods);
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    resolution: response.resolution,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getTimeDistribution: build.query<TimeDistribution, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.timeDistribution(), params: queryParams })
        }),
        getTimeDistributionByRegion: build.query<TimeDistributionByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.timeDistributionByRegion(), params: queryParams }),
            transformResponse: (response: TimeDistributionByRegion) => {
                const map = new Map<number, TimeDistributionInfo>();

                for (const { regionId, ...timeDistributionInfo } of response.regions) {
                    map.set(regionId, { ...timeDistributionInfo });
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getMaxCount: build.query<MaxCount, AnalyticsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.maxCount(), params: queryParams })
        }),
        getMaxCountByRegion: build.query<MaxCountByRegionMap, AnalyticsRegionsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.maxCountByRegion(), params: queryParams }),
            transformResponse: (response: MaxCountByRegion) => {
                const map = new Map<number, MaxCountInfo>();

                for (const { regionId, ...maxCountInfo } of response.regions) {
                    map.set(regionId, { ...maxCountInfo });
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    resolution: response.resolution,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getEmptyDaysByRegion: build.query<EmptyDaysByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.emptyDaysByRegion(), params: queryParams }),
            transformResponse: (response: EmptyDaysByRegion) => {
                const map = new Map<number, number>();

                for (const { regionId, emptyDaysCount } of response.regions) {
                    map.set(regionId, emptyDaysCount);
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getDensityByRegion: build.query<DensityByRegionMap, AnalyticsDensityResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.densityByRegion(), params: queryParams }),
            transformResponse: (response: DensityByRegion) => {
                const map = new Map<number, number>();

                for (const { regionId, flightDensity } of response.regions) {
                    map.set(regionId, flightDensity);
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    partAreaKm: response.partAreaKm,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getCount: build.query<Count, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.count(), params: queryParams })
        }),
        getCountByRegion: build.query<CountByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.countByRegion(), params: queryParams }),
            transformResponse: (response: CountByRegion) => {
                const map = new Map<number, number>();

                for (const { regionId, flightsCount } of response.regions) {
                    map.set(regionId, flightsCount);
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getAverageDuration: build.query<AverageDuration, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageDuration(), params: queryParams })
        }),
        getAverageDurationByRegion: build.query<AverageDurationByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageDurationByRegion(), params: queryParams }),
            transformResponse: (response: AverageDurationByRegion) => {
                const map = new Map<number, number>();

                for (const { regionId, averageFlightDurationSeconds } of response.regions) {
                    map.set(regionId, averageFlightDurationSeconds);
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getAverageCount: build.query<AverageCount, AnalyticsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageCount(), params: queryParams })
        }),
        getAverageCountByRegion: build.query<AverageCountByRegionMap, AnalyticsRegionsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageCountByRegion(), params: queryParams }),
            transformResponse: (response: AverageCountByRegion) => {
                const map = new Map<number, AverageCountInfo>();

                for (const { regionId, ...averageCountInfo } of response.regions) {
                    map.set(regionId, { ...averageCountInfo });
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    resolution: response.resolution,
                    regionsMap: Object.fromEntries(map)
                };
            }
        }),
        getFlightsBetweenRegion: build.query<FlightsBetweenRegionsFormatted, void>({
            query: () => ({ url: apiUrls.flightsBetweenRegion() }),
            transformResponse: (response: FlightsBetweenRegions) => {
                const map = new Map<number, FlightBetweenRegions[]>();

                for (const region of response.regions) {
                    map.set(region.regionId, [
                        ...region.topDepartureRegions.map((departureRegion) => ({
                            departureRegionId: departureRegion,
                            destinationRegionId: region.regionId
                        })),
                        ...region.topDestinationRegions.map((destinationRegion) => ({
                            departureRegionId: region.regionId,
                            destinationRegionId: destinationRegion
                        }))
                    ]);
                }

                return {
                    count: response.count,
                    topFly: response.topFly,
                    regionFlights: Object.fromEntries(map)
                };
            }
        })
    })
});

export const {
    useGetTrendQuery,
    useGetTimeDistributionQuery,
    useGetTimeDistributionByRegionQuery,
    useGetMaxCountQuery,
    useGetMaxCountByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetDensityByRegionQuery,
    useGetCountQuery,
    useGetCountByRegionQuery,
    useGetAverageDurationQuery,
    useGetAverageDurationByRegionQuery,
    useGetAverageCountQuery,
    useGetAverageCountByRegionQuery,
    useGetFlightsBetweenRegionQuery
} = analyticsApi;

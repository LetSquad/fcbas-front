import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@api/api";
import apiUrls from "@api/apiUrls";
import { toRecord } from "@coreUtils/utils";
import { OperatorType } from "@models/analytics/enums";
import {
    AnalyticsBaseQueryParams,
    AnalyticsDensityResolutionQueryParams,
    AnalyticsOperatorsQueryParams,
    AnalyticsRegionsQueryParams,
    AnalyticsRegionsResolutionQueryParams,
    AnalyticsResolutionQueryParams,
    AverageCount,
    AverageCountByRegion,
    AverageCountByRegionMap,
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
    FlightsBetweenRegions,
    FlightsBetweenRegionsFormatted,
    FlightsCountByOperator,
    FlightsCountByOperatorMap,
    MaxCount,
    MaxCountByRegion,
    MaxCountByRegionMap,
    TimeDistribution,
    TimeDistributionByRegion,
    TimeDistributionByRegionMap,
    Trend,
    TrendByRegion,
    TrendByRegionMap
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
            transformResponse: (response: TrendByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                resolution: response.resolution,
                regionsMap: toRecord(response.regions.map(({ regionId, periods }) => [regionId, periods] as const))
            })
        }),
        getTimeDistribution: build.query<TimeDistribution, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.timeDistribution(), params: queryParams })
        }),
        getTimeDistributionByRegion: build.query<TimeDistributionByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.timeDistributionByRegion(), params: queryParams }),
            transformResponse: (response: TimeDistributionByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                regionsMap: toRecord(
                    response.regions.map(({ regionId, ...timeDistributionInfo }) => [regionId, { ...timeDistributionInfo }] as const)
                )
            })
        }),
        getMaxCount: build.query<MaxCount, AnalyticsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.maxCount(), params: queryParams })
        }),
        getMaxCountByRegion: build.query<MaxCountByRegionMap, AnalyticsRegionsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.maxCountByRegion(), params: queryParams }),
            transformResponse: (response: MaxCountByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                resolution: response.resolution,
                regionsMap: toRecord(response.regions.map(({ regionId, ...maxCountInfo }) => [regionId, { ...maxCountInfo }] as const))
            })
        }),
        getEmptyDaysByRegion: build.query<EmptyDaysByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.emptyDaysByRegion(), params: queryParams }),
            transformResponse: (response: EmptyDaysByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                regionsMap: toRecord(response.regions.map(({ regionId, emptyDaysCount }) => [regionId, emptyDaysCount] as const))
            })
        }),
        getDensityByRegion: build.query<DensityByRegionMap, AnalyticsDensityResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.densityByRegion(), params: queryParams }),
            transformResponse: (response: DensityByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                partAreaKm: response.partAreaKm,
                regionsMap: toRecord(response.regions.map(({ regionId, flightDensity }) => [regionId, flightDensity] as const))
            })
        }),
        getCount: build.query<Count, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.count(), params: queryParams })
        }),
        getCountByRegion: build.query<CountByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.countByRegion(), params: queryParams }),
            transformResponse: (response: CountByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                regionsMap: toRecord(response.regions.map(({ regionId, flightsCount }) => [regionId, flightsCount] as const))
            })
        }),
        getAverageDuration: build.query<AverageDuration, AnalyticsBaseQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageDuration(), params: queryParams })
        }),
        getAverageDurationByRegion: build.query<AverageDurationByRegionMap, AnalyticsRegionsQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageDurationByRegion(), params: queryParams }),
            transformResponse: (response: AverageDurationByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                regionsMap: toRecord(
                    response.regions.map(({ regionId, averageFlightDurationSeconds }) => [regionId, averageFlightDurationSeconds] as const)
                )
            })
        }),
        getAverageCount: build.query<AverageCount, AnalyticsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageCount(), params: queryParams })
        }),
        getAverageCountByRegion: build.query<AverageCountByRegionMap, AnalyticsRegionsResolutionQueryParams | undefined>({
            query: (queryParams) => ({ url: apiUrls.averageCountByRegion(), params: queryParams }),
            transformResponse: (response: AverageCountByRegion) => ({
                startDate: response.startDate,
                finishDate: response.finishDate,
                resolution: response.resolution,
                regionsMap: toRecord(
                    response.regions.map(({ regionId, ...averageCountInfo }) => [regionId, { ...averageCountInfo }] as const)
                )
            })
        }),
        getFlightsBetweenRegion: build.query<FlightsBetweenRegionsFormatted, void>({
            query: () => ({ url: apiUrls.flightsBetweenRegion() }),
            transformResponse: (response: FlightsBetweenRegions) => ({
                count: response.limit,
                topFly: response.topFly.map((flight) => ({
                    departureRegionId: flight.departureRegionId,
                    destinationRegionId: flight.destinationRegionId,
                    count: flight.count
                })),
                regionFlights: toRecord(
                    response.regions.map(
                        (region) =>
                            [
                                region.regionId,
                                [
                                    ...region.topDepartureRegions.map((departureRegion) => ({
                                        departureRegionId: departureRegion,
                                        destinationRegionId: region.regionId
                                    })),
                                    ...region.topDestinationRegions.map((destinationRegion) => ({
                                        departureRegionId: region.regionId,
                                        destinationRegionId: destinationRegion
                                    }))
                                ]
                            ] as const
                    )
                ),
                regionCounts: toRecord(response.regions.map(({ regionId, count }) => [regionId, count] as const))
            })
        }),
        getFlightsCountByOperator: build.query<FlightsCountByOperatorMap, AnalyticsOperatorsQueryParams | undefined>({
            query: (queryParams) => ({
                url: apiUrls.countByOperator(),
                params: queryParams
            }),
            transformResponse: (response: FlightsCountByOperator) => {
                const operatorsMap: Record<OperatorType, Record<string, number>> = {
                    [OperatorType.UL]: {},
                    [OperatorType.FL]: {}
                };

                for (const { operator, flightsCount, type } of response.operators) {
                    operatorsMap[type][operator] = flightsCount;
                }

                return {
                    startDate: response.startDate,
                    finishDate: response.finishDate,
                    operatorsMap
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
    useGetFlightsBetweenRegionQuery,
    useGetFlightsCountByOperatorQuery
} = analyticsApi;

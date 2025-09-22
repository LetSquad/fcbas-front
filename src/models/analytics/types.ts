import { TimeResolution } from "@models/analytics/enums";

export interface AnalyticsBaseQueryParams {
    startDate?: string;
    endDate?: string;
}

export interface AnalyticsRegionsQueryParams extends AnalyticsBaseQueryParams {
    regionIds?: number[];
}

export interface AnalyticsResolutionQueryParams extends AnalyticsBaseQueryParams {
    resolution?: TimeResolution;
}

export interface AnalyticsRegionsResolutionQueryParams extends AnalyticsRegionsQueryParams {
    resolution?: TimeResolution;
}

export interface AnalyticsDensityResolutionQueryParams extends AnalyticsRegionsQueryParams {
    partAreaKm?: number;
}

export interface TrendPeriod {
    date: string;
    percentageChange: number;
    flightsCount: number;
}

export interface Trend {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    periods: TrendPeriod[];
}

export interface TrendRegion {
    regionId: number;
    periods: TrendPeriod[];
}

export interface TrendByRegion {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regions: TrendRegion[];
}

export interface TrendByRegionMap {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regionsMap: Record<number, TrendPeriod[]>;
}

export interface TimeDistributionInfo {
    morningFlightsCount: number;
    dayMiddleFlightsCount: number;
    eveningFlightsCount: number;
}

export interface TimeDistribution extends TimeDistributionInfo {
    startDate: string;
    finishDate: string;
}

export interface TimeDistributionRegion extends TimeDistributionInfo {
    regionId: number;
}

export interface TimeDistributionByRegion {
    startDate: string;
    finishDate: string;
    regions: TimeDistributionRegion[];
}

export interface TimeDistributionByRegionMap {
    startDate: string;
    finishDate: string;
    regionsMap: Record<number, TimeDistributionInfo>;
}

export interface MaxCountInfo {
    maxFlightsPeriodStart: string;
    maxFlightsCount: number;
}

export interface MaxCount extends MaxCountInfo {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
}

export interface MaxCountRegion extends MaxCountInfo {
    regionId: number;
}

export interface MaxCountByRegion {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regions: MaxCountRegion[];
}

export interface MaxCountByRegionMap {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regionsMap: Record<number, MaxCountInfo>;
}

export interface EmptyDaysRegion {
    regionId: number;
    emptyDaysCount: number;
}

export interface EmptyDaysByRegion {
    startDate: string;
    finishDate: string;
    regions: EmptyDaysRegion[];
}

export interface EmptyDaysByRegionMap {
    startDate: string;
    finishDate: string;
    regionsMap: Record<number, number>;
}

export interface DensityRegion {
    regionId: number;
    flightDensity: number;
}

export interface DensityByRegion {
    startDate: string;
    finishDate: string;
    partAreaKm: number;
    regions: DensityRegion[];
}

export interface DensityByRegionMap {
    startDate: string;
    finishDate: string;
    partAreaKm: number;
    regionsMap: Record<number, number>;
}

export interface Count {
    startDate: string;
    finishDate: string;
    flightsCount: number;
}

export interface CountRegion {
    regionId: number;
    flightsCount: number;
}

export interface CountByRegion {
    startDate: string;
    finishDate: string;
    regions: CountRegion[];
}

export interface CountByRegionMap {
    startDate: string;
    finishDate: string;
    regionsMap: Record<number, number>;
}

export interface AverageDuration {
    startDate: string;
    finishDate: string;
    averageFlightDurationSeconds: number;
}

export interface AverageDurationRegion {
    regionId: number;
    averageFlightDurationSeconds: number;
}

export interface AverageDurationByRegion {
    startDate: string;
    finishDate: string;
    regions: AverageDurationRegion[];
}

export interface AverageDurationByRegionMap {
    startDate: string;
    finishDate: string;
    regionsMap: Record<number, number>;
}

export interface AverageCountInfo {
    averageFlightsCount: number;
    medianFlightsCount: number;
}

export interface AverageCount extends AverageCountInfo {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
}

export interface AverageCountRegion extends AverageCountInfo {
    regionId: number;
}

export interface AverageCountByRegion {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regions: AverageCountRegion[];
}

export interface AverageCountByRegionMap {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
    regionsMap: Record<number, AverageCountInfo>;
}

export interface FlightBetweenRegions {
    departureRegionId: number;
    destinationRegionId: number;
}

interface FlightsBetweenRegionsFly {
    regionId: number;
    topDestinationRegions: number[];
    topDepartureRegions: number[];
}

export interface FlightsBetweenRegions {
    count: number;
    topFly: FlightBetweenRegions[];
    regions: FlightsBetweenRegionsFly[];
}

export interface FlightsBetweenRegionsFormatted {
    count: number;
    topFly: FlightBetweenRegions[];
    regionFlights: Record<number, FlightBetweenRegions[]>;
}

export interface HeatMapInfo {
    flightCount: number;
    averageFlightDurationSeconds: number;
    averageFlightCount: number;
    medianFlightCount: number;
    emptyDays: number;
}

export interface HeatMapBin {
    from: number; // включительно
    to: number; // верхняя граница; для последней корзины включительно
    color: string;
}

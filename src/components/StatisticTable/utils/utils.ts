import { DateTime, Duration } from "luxon";

import type {
    AverageCountByRegionMap,
    AverageDurationByRegionMap,
    CountByRegionMap,
    DensityByRegionMap,
    EmptyDaysByRegionMap,
    MaxCountByRegionMap,
    TableColumnKey,
    TableData,
    TimeDistributionByRegionMap
} from "@models/analytics/types";
import type { Region, RegionRecords } from "@models/regions/types";

export function formatAverageDuration(durationSeconds: number) {
    return durationSeconds === -1 ? "-" : Duration.fromObject({ seconds: durationSeconds }).toFormat("hh:mm:ss");
}

export function formatBaseValue(value: number) {
    return value === -1 ? "-" : value;
}

export function formatMaxCount(rowData: TableData) {
    if (rowData.maxCount.count === -1) {
        return "-";
    }

    const periodStart = rowData.maxCount.periodStart
        ? `${DateTime.fromISO(rowData.maxCount.periodStart).toFormat("dd.MM.yyyy HH:mm")} - `
        : "";

    return `${periodStart}${rowData.maxCount.count}`;
}

export function formatTableData(
    regions: RegionRecords | undefined,
    countByRegion: CountByRegionMap | undefined,
    averageDurationByRegion: AverageDurationByRegionMap | undefined,
    averageCountByRegion: AverageCountByRegionMap | undefined,
    emptyDaysByRegion: EmptyDaysByRegionMap | undefined,
    densityByRegion: DensityByRegionMap | undefined,
    timeDistributionsByRegion: TimeDistributionByRegionMap | undefined,
    maxCountByRegion: MaxCountByRegionMap | undefined
): TableData[] {
    return regions
        ? Object.values(regions).map((region: Region) => ({
              region: region.name,
              count: countByRegion?.regionsMap?.[region.id] || -1,
              averageCount: averageCountByRegion?.regionsMap?.[region.id]?.averageFlightsCount || -1,
              medianCount: averageCountByRegion?.regionsMap?.[region.id]?.medianFlightsCount || -1,
              maxCount: {
                  count: maxCountByRegion?.regionsMap?.[region.id]?.maxFlightsCount || -1,
                  periodStart: maxCountByRegion?.regionsMap?.[region.id]?.maxFlightsPeriodStart
              },
              averageDuration: averageDurationByRegion?.regionsMap?.[region.id] || -1,
              density: densityByRegion?.regionsMap?.[region.id] ? Math.round(densityByRegion.regionsMap[region.id] * 100) / 100 : -1,
              emptyDays: emptyDaysByRegion?.regionsMap?.[region.id] || -1,
              timeDistribution: {
                  morningCount: timeDistributionsByRegion?.regionsMap?.[region.id]?.morningFlightsCount || -1,
                  dayCount: timeDistributionsByRegion?.regionsMap?.[region.id]?.dayMiddleFlightsCount || -1,
                  eveningCount: timeDistributionsByRegion?.regionsMap?.[region.id]?.eveningFlightsCount || -1
              }
          }))
        : [];
}

export function buildExportRows(tableData: TableData[]) {
    return tableData.map((row) => ({
        Регион: row.region,
        "Количество полетов": formatBaseValue(row.count),
        "Среднее количество полетов": formatBaseValue(row.averageCount),
        "Медианное количество полетов": formatBaseValue(row.medianCount),
        "Максимальное количество полетов": formatBaseValue(row.maxCount.count),
        "Начало периода максимума": row.maxCount.periodStart
            ? DateTime.fromISO(row.maxCount.periodStart).toFormat("dd.MM.yyyy HH:mm")
            : "-",
        "Средняя длительность полета": formatAverageDuration(row.averageDuration),
        "Интенсивность полетов": formatBaseValue(row.density),
        "Количество дней без полетов": formatBaseValue(row.emptyDays),
        "Утренних полетов": formatBaseValue(row.timeDistribution.morningCount),
        "Дневных полетов": formatBaseValue(row.timeDistribution.dayCount),
        "Вечерних полетов": formatBaseValue(row.timeDistribution.eveningCount)
    }));
}

export function getColumnBodyValue(columnKey: TableColumnKey, row: TableData): string | number {
    switch (columnKey) {
        case "count": {
            return formatBaseValue(row.count);
        }
        case "averageCount": {
            return formatBaseValue(row.averageCount);
        }
        case "medianCount": {
            return formatBaseValue(row.medianCount);
        }
        case "maxCount.count": {
            return formatMaxCount(row);
        }
        case "averageDuration": {
            return formatAverageDuration(row.averageDuration);
        }
        case "density": {
            return formatBaseValue(row.density);
        }
        case "emptyDays": {
            return formatBaseValue(row.emptyDays);
        }
        case "timeDistribution.morningCount": {
            return formatBaseValue(row.timeDistribution.morningCount);
        }
        case "timeDistribution.dayCount": {
            return formatBaseValue(row.timeDistribution.dayCount);
        }
        case "timeDistribution.eveningCount": {
            return formatBaseValue(row.timeDistribution.eveningCount);
        }
        default: {
            return "-";
        }
    }
}

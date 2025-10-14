import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { DateTime, Duration } from "luxon";
import { FilterMatchMode } from "primereact/api";
import {
    Column,
    ColumnFilterApplyTemplateOptions,
    ColumnFilterClearTemplateOptions,
    ColumnFilterElementTemplateOptions
} from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { MultiSelect } from "primereact/multiselect";
import { Row } from "primereact/row";
import { Button } from "semantic-ui-react";

import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useFilterForm } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import {
    AverageCountByRegionMap,
    AverageDurationByRegionMap,
    CountByRegionMap,
    DensityByRegionMap,
    EmptyDaysByRegionMap,
    MaxCountByRegionMap,
    TimeDistributionByRegionMap
} from "@models/analytics/types";
import { Region, RegionRecords } from "@models/regions/types";
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

import styles from "./styles/StatisticTable.module.scss";

interface TableData {
    region: string;
    count: number;
    averageCount: number;
    medianCount: number;
    maxCount: {
        count: number;
        periodStart: string | undefined;
    };
    averageDuration: number;
    density: number;
    emptyDays: number;
    timeDistribution: {
        morningCount: number;
        dayCount: number;
        eveningCount: number;
    };
}

function averageDurationBody(rowData: TableData) {
    return rowData.averageDuration === -1 ? "-" : Duration.fromObject({ seconds: rowData.averageDuration }).toFormat("hh:mm:ss");
}

function baseBody(data: number) {
    return data === -1 ? "-" : data;
}

function maxCountBody(rowData: TableData) {
    return rowData.maxCount.count === -1
        ? "-"
        : `${rowData.maxCount.periodStart ? `${DateTime.fromISO(rowData.maxCount.periodStart).toFormat("dd.MM.yyyy hh:mm")} - ` : ""} ${rowData.maxCount.count}`;
}

function formatTableData(
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

export default function StatisticTable() {
    const formData = useFilterForm();

    const { data: regions } = useSelector(regionsApi.endpoints.getRegions.select());

    const {
        data: countByRegion,
        isLoading: isCountByRegionsLoading,
        isFetching: isCountByRegionsFetching,
        isError: isCountByRegionsError,
        isSuccess: isCountByRegionsSuccess,
        refetch: refetchCountByRegion
    } = useGetCountByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const {
        data: averageDurationByRegion,
        isLoading: isAverageDurationByRegionsLoading,
        isFetching: isAverageDurationByRegionsFetching,
        isError: isAverageDurationByRegionsError,
        isSuccess: isAverageDurationByRegionsSuccess,
        refetch: refetchAverageDurationByRegions
    } = useGetAverageDurationByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: averageCountByRegion,
        isLoading: isAverageCountByRegionsLoading,
        isFetching: isAverageCountByRegionsFetching,
        isError: isAverageCountByRegionsError,
        isSuccess: isAverageCountByRegionsSuccess,
        refetch: refetchAverageCountByRegions
    } = useGetAverageCountByRegionQuery(formData);

    const {
        data: emptyDaysByRegion,
        isLoading: isEmptyDaysByRegionsLoading,
        isFetching: isEmptyDaysByRegionsFetching,
        isError: isEmptyDaysByRegionsError,
        isSuccess: isEmptyDaysByRegionsSuccess,
        refetch: refetchEmptyDaysByRegions
    } = useGetEmptyDaysByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isFetching: isDensityByRegionsFetching,
        isError: isDensityByRegionsError,
        isSuccess: isDensityByRegionsSuccess,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const {
        data: timeDistributionsByRegion,
        isLoading: isTimeDistributionsByRegionLoading,
        isFetching: isTimeDistributionsByRegionFetching,
        isError: isTimeDistributionsByRegionError,
        isSuccess: isTimeDistributionsByRegionSuccess,
        refetch: refetchTimeDistributionsByRegion
    } = useGetTimeDistributionByRegionQuery({
        startDate: formData.startDate,
        finishDate: formData.finishDate
    });

    const {
        data: maxCountByRegion,
        isLoading: isMaxCountByRegionsLoading,
        isFetching: isMaxCountByRegionsFetching,
        isError: isMaxCountByRegionsError,
        isSuccess: isMaxCountByRegionsSuccess,
        refetch: refetchMaxCountByRegions
    } = useGetMaxCountByRegionQuery(formData);

    const [tableData, setTableData] = useState<TableData[]>();
    const [filter, setFilter] = useState<DataTableFilterMeta>({ region: { value: null, matchMode: FilterMatchMode.IN } });

    const analyticsQueries = useMemo(
        () => [
            {
                isLoading: isCountByRegionsLoading || isCountByRegionsFetching,
                isError: isCountByRegionsError,
                isSuccess: isCountByRegionsSuccess,
                refetch: refetchCountByRegion
            },
            {
                isLoading: isAverageDurationByRegionsLoading || isAverageDurationByRegionsFetching,
                isError: isAverageDurationByRegionsError,
                isSuccess: isAverageDurationByRegionsSuccess,
                refetch: refetchAverageDurationByRegions
            },
            {
                isLoading: isAverageCountByRegionsLoading || isAverageCountByRegionsFetching,
                isError: isAverageCountByRegionsError,
                isSuccess: isAverageCountByRegionsSuccess,
                refetch: refetchAverageCountByRegions
            },
            {
                isLoading: isEmptyDaysByRegionsLoading || isEmptyDaysByRegionsFetching,
                isError: isEmptyDaysByRegionsError,
                isSuccess: isEmptyDaysByRegionsSuccess,
                refetch: refetchEmptyDaysByRegions
            },
            {
                isLoading: isDensityByRegionsLoading || isDensityByRegionsFetching,
                isError: isDensityByRegionsError,
                isSuccess: isDensityByRegionsSuccess,
                refetch: refetchDensityByRegions
            },
            {
                isLoading: isTimeDistributionsByRegionLoading || isTimeDistributionsByRegionFetching,
                isError: isTimeDistributionsByRegionError,
                isSuccess: isTimeDistributionsByRegionSuccess,
                refetch: refetchTimeDistributionsByRegion
            },
            {
                isLoading: isMaxCountByRegionsLoading || isMaxCountByRegionsFetching,
                isError: isMaxCountByRegionsError,
                isSuccess: isMaxCountByRegionsSuccess,
                refetch: refetchMaxCountByRegions
            }
        ],
        [
            isAverageCountByRegionsError,
            isAverageCountByRegionsFetching,
            isAverageCountByRegionsLoading,
            isAverageCountByRegionsSuccess,
            isAverageDurationByRegionsError,
            isAverageDurationByRegionsFetching,
            isAverageDurationByRegionsLoading,
            isAverageDurationByRegionsSuccess,
            isCountByRegionsError,
            isCountByRegionsFetching,
            isCountByRegionsLoading,
            isCountByRegionsSuccess,
            isDensityByRegionsError,
            isDensityByRegionsFetching,
            isDensityByRegionsLoading,
            isDensityByRegionsSuccess,
            isEmptyDaysByRegionsError,
            isEmptyDaysByRegionsFetching,
            isEmptyDaysByRegionsLoading,
            isEmptyDaysByRegionsSuccess,
            isMaxCountByRegionsError,
            isMaxCountByRegionsFetching,
            isMaxCountByRegionsLoading,
            isMaxCountByRegionsSuccess,
            isTimeDistributionsByRegionError,
            isTimeDistributionsByRegionFetching,
            isTimeDistributionsByRegionLoading,
            isTimeDistributionsByRegionSuccess,
            refetchAverageCountByRegions,
            refetchAverageDurationByRegions,
            refetchCountByRegion,
            refetchDensityByRegions,
            refetchEmptyDaysByRegions,
            refetchMaxCountByRegions,
            refetchTimeDistributionsByRegion
        ]
    );

    const isLoading = useMemo(() => analyticsQueries.some((query) => query.isLoading), [analyticsQueries]);
    const isError = useMemo(() => analyticsQueries.some((query) => query.isError), [analyticsQueries]);
    const isSuccess = useMemo(() => analyticsQueries.some((query) => query.isSuccess), [analyticsQueries]);
    const refetchFunction = useMemo(() => analyticsQueries.find((query) => query.isError)?.refetch, [analyticsQueries]);

    const filterClearTemplate = useCallback(
        (options: ColumnFilterClearTemplateOptions) => (
            <Button type="button" onClick={options.filterClearCallback} severity="secondary">
                Очистить
            </Button>
        ),
        []
    );

    const filterApplyTemplate = useCallback(
        (options: ColumnFilterApplyTemplateOptions) => (
            <Button type="button" onClick={() => options.filterApplyCallback()} severity="primary">
                Применить
            </Button>
        ),
        []
    );

    const regionOptions = useMemo(() => {
        if (!regions) {
            return [];
        }

        return Object.values(regions).map((region) => ({
            value: region.name,
            label: region.name
        }));
    }, [regions]);

    const regionFilterElement = useCallback(
        (options: ColumnFilterElementTemplateOptions) => (
            <MultiSelect
                value={options.value}
                options={regionOptions}
                onChange={(event) => options.filterCallback(event.value)}
                placeholder="Любой"
                className={styles.regionFilter}
            />
        ),
        [regionOptions]
    );

    const headerGroup = useMemo(
        () => (
            <ColumnGroup>
                <Row>
                    <Column rowSpan={2} frozen />
                    <Column
                        filter
                        showFilterMatchModes={false}
                        filterElement={regionFilterElement}
                        filterApply={filterApplyTemplate}
                        filterClear={filterClearTemplate}
                        field="region"
                        header="Регион"
                        rowSpan={2}
                        frozen
                        sortable
                    />
                    <Column field="count" sortable header="Количество полетов" rowSpan={2} />
                    <Column
                        field="averageCount"
                        sortable
                        header={`Среднее количество полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
                        rowSpan={2}
                    />
                    <Column
                        field="medianCount"
                        sortable
                        header={`Медианное количество полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
                        rowSpan={2}
                    />
                    <Column
                        field="maxCount.count"
                        sortable
                        header={`Максимальное количество полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
                        rowSpan={2}
                    />
                    <Column field="averageDuration" sortable header="Средняя длительность полета" rowSpan={2} />
                    <Column
                        field="density"
                        sortable
                        header={`Интенсивность полетов${densityByRegions ? ` (на ${densityByRegions.partAreaKm} км²)` : ""}`}
                        rowSpan={2}
                    />
                    <Column field="emptyDays" sortable header="Количество дней без полетов" rowSpan={2} />
                    <Column header="Дневное распределение полетов" colSpan={3} alignHeader="center" />
                </Row>
                <Row>
                    <Column header="Утро" sortable field="timeDistribution.morningCount" />
                    <Column header="День" sortable field="timeDistribution.dayCount" />
                    <Column header="Вечер" sortable field="timeDistribution.eveningCount" />
                </Row>
            </ColumnGroup>
        ),
        [densityByRegions, filterApplyTemplate, filterClearTemplate, formData.resolution, regionFilterElement]
    );

    const formattedTableData = useMemo(
        () =>
            formatTableData(
                regions,
                countByRegion,
                averageDurationByRegion,
                averageCountByRegion,
                emptyDaysByRegion,
                densityByRegions,
                timeDistributionsByRegion,
                maxCountByRegion
            ),
        [
            averageCountByRegion,
            averageDurationByRegion,
            countByRegion,
            densityByRegions,
            emptyDaysByRegion,
            maxCountByRegion,
            regions,
            timeDistributionsByRegion
        ]
    );

    useEffect(() => {
        if (!isLoading && isSuccess) {
            setTableData(formattedTableData);
        }
    }, [formattedTableData, isLoading, isSuccess]);

    return (
        <div className={styles.container}>
            {isError && <LoadingErrorBlock isLoadingErrorObjectText="данных статистики" reload={refetchFunction} />}
            <DataTable
                scrollable
                scrollHeight="flex"
                value={tableData}
                reorderableRows
                removableSort
                showGridlines
                emptyMessage="Данные не найдены."
                filters={filter}
                onFilter={(event) => setFilter(event.filters)}
                onRowReorder={(event) => setTableData(event.value)}
                loading={isLoading || tableData === undefined}
                headerColumnGroup={headerGroup}
            >
                <Column rowReorder frozen />
                <Column field="region" frozen />
                <Column field="count" body={(rowData: TableData) => baseBody(rowData.count)} />
                <Column field="averageCount" body={(rowData: TableData) => baseBody(rowData.averageCount)} />
                <Column field="medianCount" body={(rowData: TableData) => baseBody(rowData.medianCount)} />
                <Column field="maxCount.count" body={maxCountBody} />
                <Column field="averageDuration" body={averageDurationBody} />
                <Column field="density" body={(rowData: TableData) => baseBody(rowData.density)} />
                <Column field="emptyDays" body={(rowData: TableData) => baseBody(rowData.emptyDays)} />
                <Column
                    field="timeDistribution.morningCount"
                    body={(rowData: TableData) => baseBody(rowData.timeDistribution.morningCount)}
                />
                <Column field="timeDistribution.dayCount" body={(rowData: TableData) => baseBody(rowData.timeDistribution.dayCount)} />
                <Column
                    field="timeDistribution.eveningCount"
                    body={(rowData: TableData) => baseBody(rowData.timeDistribution.eveningCount)}
                />
            </DataTable>
        </div>
    );
}

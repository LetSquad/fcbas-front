import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DateTime } from "luxon";
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

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useFilterForm } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { buildExportRows, getColumnBodyValue } from "@components/StatisticTable/utils/utils";
import type { TableColumnKey, TableData } from "@models/analytics/types";

import styles from "./styles/StatisticTable.module.scss";
import Toolbar from "./Toolbar";
import { useRegionAnalytics } from "./utils/hooks/useRegionAnalytics";

const DEFAULT_VISIBLE_COLUMNS: TableColumnKey[] = [
    "count",
    "averageCount",
    "medianCount",
    "maxCount.count",
    "averageDuration",
    "density",
    "emptyDays",
    "timeDistribution.morningCount",
    "timeDistribution.dayCount",
    "timeDistribution.eveningCount"
];

const COLUMN_SELECTION_OPTIONS = [
    { value: "count", text: "Количество полетов" },
    { value: "averageCount", text: "Среднее количество полетов" },
    { value: "medianCount", text: "Медианное количество полетов" },
    { value: "maxCount.count", text: "Максимальное количество полетов" },
    { value: "averageDuration", text: "Средняя длительность полета" },
    { value: "density", text: "Интенсивность полетов" },
    { value: "emptyDays", text: "Количество дней без полетов" },
    { value: "timeDistribution.morningCount", text: "Утренние полеты" },
    { value: "timeDistribution.dayCount", text: "Дневные полеты" },
    { value: "timeDistribution.eveningCount", text: "Вечерние полеты" }
] satisfies { value: TableColumnKey; text: string }[];

const TOP_LEVEL_COLUMN_KEYS: TableColumnKey[] = [
    "count",
    "averageCount",
    "medianCount",
    "maxCount.count",
    "averageDuration",
    "density",
    "emptyDays"
];

const TIME_DISTRIBUTION_COLUMN_KEYS: TableColumnKey[] = [
    "timeDistribution.morningCount",
    "timeDistribution.dayCount",
    "timeDistribution.eveningCount"
];

export default function StatisticTable() {
    const formData = useFilterForm();

    const { regions, densityPartAreaKm, formattedTableData, statusSummary, refetchErroredQueries } = useRegionAnalytics();

    const [tableData, setTableData] = useState<TableData[]>();
    const [filter, setFilter] = useState<DataTableFilterMeta>({ region: { value: null, matchMode: FilterMatchMode.IN } });
    const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);

    const dataTableRef = useRef<DataTable<TableData[]> | null>(null);

    useEffect(() => {
        if (!statusSummary.isLoading && !statusSummary.hasError && statusSummary.hasSuccess) {
            setTableData(formattedTableData);
        }
    }, [formattedTableData, statusSummary.hasError, statusSummary.hasSuccess, statusSummary.isLoading]);

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

    const regionOptions = useMemo<{ value: string; label: string }[]>(() => {
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

    const visibleColumnsSet = useMemo(() => new Set(visibleColumns), [visibleColumns]);

    const timeDistributionVisibleCount = useMemo(
        () => TIME_DISTRIBUTION_COLUMN_KEYS.filter((key) => visibleColumnsSet.has(key)).length,
        [visibleColumnsSet]
    );

    const resolutionDescription = useMemo(() => getTimeResolutionDescriptionFromEnum(formData.resolution), [formData.resolution]);

    const getColumnHeader = useCallback(
        (columnKey: TableColumnKey) => {
            switch (columnKey) {
                case "count": {
                    return "Количество полетов";
                }
                case "averageCount": {
                    return `Среднее количество полетов ${resolutionDescription}`;
                }
                case "medianCount": {
                    return `Медианное количество полетов ${resolutionDescription}`;
                }
                case "maxCount.count": {
                    return `Максимальное количество полетов ${resolutionDescription}`;
                }
                case "averageDuration": {
                    return "Средняя длительность полета";
                }
                case "density": {
                    return `Интенсивность полетов${densityPartAreaKm ? ` (на ${densityPartAreaKm} км²)` : ""}`;
                }
                case "emptyDays": {
                    return "Количество дней без полетов";
                }
                case "timeDistribution.morningCount": {
                    return "Утро";
                }
                case "timeDistribution.dayCount": {
                    return "День";
                }
                case "timeDistribution.eveningCount": {
                    return "Вечер";
                }
                default: {
                    return "";
                }
            }
        },
        [densityPartAreaKm, resolutionDescription]
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
                    {TOP_LEVEL_COLUMN_KEYS.map((columnKey) =>
                        visibleColumnsSet.has(columnKey) ? (
                            <Column key={columnKey} field={columnKey} sortable header={getColumnHeader(columnKey)} rowSpan={2} />
                        ) : null
                    )}
                    {timeDistributionVisibleCount > 0 && (
                        <Column header="Дневное распределение полетов" colSpan={timeDistributionVisibleCount} alignHeader="center" />
                    )}
                </Row>
                {timeDistributionVisibleCount > 0 && (
                    <Row>
                        {TIME_DISTRIBUTION_COLUMN_KEYS.map((columnKey) =>
                            visibleColumnsSet.has(columnKey) ? (
                                <Column key={columnKey} header={getColumnHeader(columnKey)} sortable field={columnKey} />
                            ) : null
                        )}
                    </Row>
                )}
            </ColumnGroup>
        ),
        [filterApplyTemplate, filterClearTemplate, getColumnHeader, regionFilterElement, timeDistributionVisibleCount, visibleColumnsSet]
    );

    const handleExportCSV = useCallback(() => {
        dataTableRef.current?.exportCSV();
    }, []);

    const handleExportXLSX = useCallback(async () => {
        try {
            if (!tableData?.length) {
                return;
            }

            const xlsx = await import("xlsx");
            const worksheet = xlsx.utils.json_to_sheet(buildExportRows(tableData));
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "Статистика");
            const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmm");
            xlsx.writeFile(workbook, `region-statistics_${timestamp}.xlsx`);
        } catch (error) {
            console.error("Не удалось экспортировать таблицу в XLSX", error);
        }
    }, [tableData]);

    const exportDisabled = !tableData?.length || statusSummary.isLoading;

    return (
        <Flex column rowGap="10px" className={styles.container}>
            <Toolbar
                isDisabled={exportDisabled}
                onExportCSV={handleExportCSV}
                onExportXLSX={handleExportXLSX}
                columnOptions={COLUMN_SELECTION_OPTIONS}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
            />

            {statusSummary.hasError && <LoadingErrorBlock isLoadingErrorObjectText="данных статистики" reload={refetchErroredQueries} />}

            <DataTable
                ref={dataTableRef}
                scrollable
                scrollHeight="flex"
                value={tableData || []}
                reorderableRows
                removableSort
                showGridlines
                emptyMessage="Данные не найдены."
                filters={filter}
                onFilter={(event) => setFilter(event.filters)}
                onRowReorder={(event) => setTableData(event.value)}
                loading={statusSummary.isLoading || tableData === undefined}
                headerColumnGroup={headerGroup}
            >
                <Column rowReorder frozen />
                <Column field="region" frozen />
                {TOP_LEVEL_COLUMN_KEYS.map((columnKey) =>
                    visibleColumnsSet.has(columnKey) ? (
                        <Column
                            key={columnKey}
                            field={columnKey}
                            body={(rowData: TableData) => getColumnBodyValue(columnKey, rowData)}
                            sortable
                        />
                    ) : null
                )}
                {TIME_DISTRIBUTION_COLUMN_KEYS.map((columnKey) =>
                    visibleColumnsSet.has(columnKey) ? (
                        <Column
                            key={columnKey}
                            field={columnKey}
                            body={(rowData: TableData) => getColumnBodyValue(columnKey, rowData)}
                            sortable
                        />
                    ) : null
                )}
            </DataTable>
        </Flex>
    );
}

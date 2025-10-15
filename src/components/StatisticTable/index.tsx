import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { DateTime } from "luxon";
import {
    Column,
    ColumnFilterApplyTemplateOptions,
    ColumnFilterClearTemplateOptions,
    ColumnFilterElementTemplateOptions
} from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { DataTable, DataTableColReorderEvent, DataTableFilterMeta } from "primereact/datatable";
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
import {
    createRegionFilterMeta,
    DEFAULT_COLUMN_ORDER,
    DEFAULT_VISIBLE_COLUMNS,
    getColumnOptionsForOrder,
    getRegionFilterValue,
    loadPreferences,
    sanitizeColumnOrder,
    sanitizeVisibleColumns,
    savePreferences,
    TIME_DISTRIBUTION_COLUMN_KEYS,
    TOP_LEVEL_COLUMN_KEYS
} from "./utils/preferences";

export default function StatisticTable() {
    const formData = useFilterForm();

    const { regions, densityPartAreaKm, formattedTableData, statusSummary, refetchErroredQueries } = useRegionAnalytics();

    const initialPreferences = useMemo(() => loadPreferences(), []);

    const [tableData, setTableData] = useState<TableData[]>();
    const [columnOrder, setColumnOrder] = useState<TableColumnKey[]>(() => initialPreferences?.columnOrder ?? [...DEFAULT_COLUMN_ORDER]);
    const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>(
        () =>
            initialPreferences?.visibleColumns ??
            sanitizeVisibleColumns(DEFAULT_VISIBLE_COLUMNS, initialPreferences?.columnOrder ?? DEFAULT_COLUMN_ORDER)
    );
    const [selectedRegions, setSelectedRegions] = useState<string[] | null>(() => initialPreferences?.regionFilter ?? null);
    const filters = useMemo<DataTableFilterMeta>(() => createRegionFilterMeta(selectedRegions), [selectedRegions]);

    const dataTableRef = useRef<DataTable<TableData[]> | null>(null);

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
            <Button type="button" primary onClick={() => options.filterApplyCallback()}>
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

    const visibleTopLevelColumns = useMemo(
        () => columnOrder.filter((key) => TOP_LEVEL_COLUMN_KEYS.includes(key) && visibleColumnsSet.has(key)),
        [columnOrder, visibleColumnsSet]
    );

    const visibleTimeColumns = useMemo(
        () => columnOrder.filter((key) => TIME_DISTRIBUTION_COLUMN_KEYS.includes(key) && visibleColumnsSet.has(key)),
        [columnOrder, visibleColumnsSet]
    );

    const shouldRenderTimeGroup = visibleTimeColumns.length > 1;

    const columnOptions = useMemo(() => getColumnOptionsForOrder(columnOrder), [columnOrder]);

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

    const headerGroup = useMemo(() => {
        const topRowColumns: TableColumnKey[] = shouldRenderTimeGroup
            ? visibleTopLevelColumns
            : [...visibleTopLevelColumns, ...visibleTimeColumns];

        return (
            <ColumnGroup>
                <Row>
                    <Column rowSpan={shouldRenderTimeGroup ? 2 : 1} frozen className={styles.reorderColumn} />
                    <Column
                        filter
                        showFilterMatchModes={false}
                        filterElement={regionFilterElement}
                        filterApply={filterApplyTemplate}
                        filterClear={filterClearTemplate}
                        field="region"
                        header="Регион"
                        rowSpan={shouldRenderTimeGroup ? 2 : 1}
                        frozen
                        sortable
                    />
                    {topRowColumns.map((columnKey) => (
                        <Column
                            key={`top-${columnKey}`}
                            field={columnKey}
                            columnKey={columnKey}
                            sortable
                            header={getColumnHeader(columnKey)}
                            rowSpan={shouldRenderTimeGroup ? 2 : 1}
                        />
                    ))}
                    {shouldRenderTimeGroup && (
                        <Column header="Дневное распределение полетов" colSpan={visibleTimeColumns.length} alignHeader="center" />
                    )}
                </Row>
                {shouldRenderTimeGroup && (
                    <Row>
                        {visibleTimeColumns.map((columnKey) => (
                            <Column
                                key={`time-${columnKey}`}
                                header={getColumnHeader(columnKey)}
                                sortable
                                field={columnKey}
                                columnKey={columnKey}
                            />
                        ))}
                    </Row>
                )}
            </ColumnGroup>
        );
    }, [
        filterApplyTemplate,
        filterClearTemplate,
        getColumnHeader,
        regionFilterElement,
        shouldRenderTimeGroup,
        visibleTimeColumns,
        visibleTopLevelColumns
    ]);

    const handleColumnReorder = useCallback(
        (event: DataTableColReorderEvent) => {
            const reorderedVisibleColumns = event.columns
                .map((column) => (column.props.columnKey ?? column.props.field) as TableColumnKey | undefined)
                .filter((key): key is TableColumnKey => key !== undefined);

            const hiddenColumns = columnOrder.filter((key) => !reorderedVisibleColumns.includes(key));
            const nextOrder = sanitizeColumnOrder([...reorderedVisibleColumns, ...hiddenColumns]);

            setColumnOrder(nextOrder);
            setVisibleColumns((previousVisible) => sanitizeVisibleColumns(previousVisible, nextOrder, previousVisible));
        },
        [columnOrder]
    );

    const handleVisibleColumnsChange = useCallback(
        (columns: TableColumnKey[]) => {
            setVisibleColumns(sanitizeVisibleColumns(columns, columnOrder));
        },
        [columnOrder]
    );

    const handleExportCSV = useCallback(() => {
        dataTableRef.current?.exportCSV();
    }, []);

    const handleExportXLSX = useCallback(async () => {
        toast.dismiss("export-pdf-error");

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

            toast.error("Не удалось экспортировать таблицу в XLSX. Попробуйте позже.", {
                id: "export-xlsx-error",
                duration: 10_000
            });
        }
    }, [tableData]);

    const handleExportPDF = useCallback(async () => {
        toast.dismiss("export-pdf-error");

        try {
            if (!tableData?.length) {
                return;
            }

            const [{ jsPDF: JsPDF }, autoTableModule, notoSansFontModule] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
                import("@coreUtils/fonts/notoSansRegularBase64")
            ]);

            const fontBase64 = notoSansFontModule.NOTO_SANS_REGULAR_BASE64;

            const exportRows = buildExportRows(tableData);

            if (exportRows.length === 0) {
                return;
            }

            const headers = Object.keys(exportRows[0]);
            const body = exportRows.map((row) => headers.map((header) => row[header as keyof typeof row]));

            const doc = new JsPDF();
            doc.addFileToVFS(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, fontBase64);
            doc.addFont(notoSansFontModule.NOTO_SANS_REGULAR_FILE_NAME, notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY, "normal");
            doc.setFont(notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY);

            const autoTable = autoTableModule.default;
            autoTable(doc, {
                head: [headers],
                body,
                styles: {
                    font: notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY,
                    fontStyle: "normal"
                },
                headStyles: {
                    font: notoSansFontModule.NOTO_SANS_REGULAR_FONT_FAMILY,
                    fontStyle: "normal"
                }
            });

            const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmm");
            doc.save(`region-statistics_${timestamp}.pdf`);
        } catch (error) {
            console.error("Не удалось экспортировать таблицу в PDF", error);

            toast.error("Не удалось экспортировать таблицу в PDF. Попробуйте позже.", {
                id: "export-pdf-error",
                duration: 10_000
            });
        }
    }, [tableData]);

    useEffect(() => {
        if (!statusSummary.isLoading && !statusSummary.hasError && statusSummary.hasSuccess) {
            setTableData(formattedTableData);
        }
    }, [formattedTableData, statusSummary.hasError, statusSummary.hasSuccess, statusSummary.isLoading, formData.resolution]);

    useEffect(() => {
        savePreferences({
            columnOrder,
            visibleColumns,
            regionFilter: selectedRegions
        });
    }, [columnOrder, selectedRegions, visibleColumns]);

    const exportDisabled = !tableData?.length || statusSummary.isLoading;

    return (
        <Flex column rowGap="10px" className={styles.container}>
            <Toolbar
                isDisabled={exportDisabled}
                onExportCSV={handleExportCSV}
                onExportXLSX={handleExportXLSX}
                onExportPDF={handleExportPDF}
                columnOptions={columnOptions}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={handleVisibleColumnsChange}
            />

            {statusSummary.hasError && <LoadingErrorBlock isLoadingErrorObjectText="данных статистики" reload={refetchErroredQueries} />}

            <DataTable
                ref={dataTableRef}
                className={styles.table}
                scrollable
                scrollHeight="flex"
                value={tableData || []}
                reorderableRows
                reorderableColumns
                removableSort
                showGridlines
                emptyMessage="Данные не найдены."
                filters={filters}
                onFilter={(event) => setSelectedRegions(getRegionFilterValue(event.filters))}
                onRowReorder={(event) => setTableData(event.value)}
                onColReorder={handleColumnReorder}
                loading={statusSummary.isLoading || tableData === undefined}
                headerColumnGroup={headerGroup}
            >
                <Column rowReorder frozen className={styles.reorderColumn} />
                <Column field="region" frozen />
                {columnOrder.map((columnKey) =>
                    visibleColumnsSet.has(columnKey) ? (
                        <Column
                            key={columnKey}
                            columnKey={columnKey}
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

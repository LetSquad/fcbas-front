import { FilterMatchMode } from "primereact/api";
import type { DataTableFilterMeta, DataTableFilterMetaData, DataTableOperatorFilterMetaData } from "primereact/datatable";

import type { StatisticTablePreferences, TableColumnKey } from "@models/analytics/types";

const STATISTIC_TABLE_STORAGE_KEY = "statisticTablePreferences";

export const DEFAULT_VISIBLE_COLUMNS: TableColumnKey[] = [
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

export const TOP_LEVEL_COLUMN_KEYS: TableColumnKey[] = [
    "count",
    "averageCount",
    "medianCount",
    "maxCount.count",
    "averageDuration",
    "density",
    "emptyDays"
];

export const TIME_DISTRIBUTION_COLUMN_KEYS: TableColumnKey[] = [
    "timeDistribution.morningCount",
    "timeDistribution.dayCount",
    "timeDistribution.eveningCount"
];

export const DEFAULT_COLUMN_ORDER: TableColumnKey[] = [...TOP_LEVEL_COLUMN_KEYS, ...TIME_DISTRIBUTION_COLUMN_KEYS];

const ALL_COLUMN_KEYS_SET = new Set<TableColumnKey>(DEFAULT_COLUMN_ORDER);

export const COLUMN_SELECTION_OPTIONS = [
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

const COLUMN_OPTIONS_MAP = new Map(COLUMN_SELECTION_OPTIONS.map((option) => [option.value, option] as const));

export const getColumnOptionsForOrder = (columnOrder: TableColumnKey[]) =>
    columnOrder
        .map((columnKey) => COLUMN_OPTIONS_MAP.get(columnKey))
        .filter((option): option is (typeof COLUMN_SELECTION_OPTIONS)[number] => option !== undefined);

export const isTableColumnKey = (value: unknown): value is TableColumnKey =>
    typeof value === "string" && ALL_COLUMN_KEYS_SET.has(value as TableColumnKey);

export function sanitizeColumnOrder(input: unknown): TableColumnKey[] {
    if (!Array.isArray(input)) {
        return [...DEFAULT_COLUMN_ORDER];
    }

    const uniqueKeys = new Set<TableColumnKey>();
    const sanitizedOrder: TableColumnKey[] = [];

    for (const value of input) {
        if (isTableColumnKey(value) && !uniqueKeys.has(value)) {
            uniqueKeys.add(value);
            sanitizedOrder.push(value);
        }
    }

    for (const defaultKey of DEFAULT_COLUMN_ORDER) {
        if (!uniqueKeys.has(defaultKey)) {
            sanitizedOrder.push(defaultKey);
        }
    }

    return sanitizedOrder;
}

export function sanitizeVisibleColumns(
    input: unknown,
    columnOrder: TableColumnKey[],
    fallback: TableColumnKey[] = DEFAULT_VISIBLE_COLUMNS
): TableColumnKey[] {
    const requested = Array.isArray(input) ? input.filter((value) => isTableColumnKey(value)) : [];
    const visibleInOrder = columnOrder.filter((key) => requested.includes(key));

    if (visibleInOrder.length > 0) {
        return visibleInOrder;
    }

    const fallbackSet = new Set(fallback);

    const fallbackInOrder = columnOrder.filter((key) => fallbackSet.has(key));

    return fallbackInOrder.length > 0 ? fallbackInOrder : [...columnOrder];
}

export function sanitizeRegionFilter(input: unknown): string[] | null {
    if (!Array.isArray(input)) {
        return null;
    }

    const values = input.filter((value): value is string => typeof value === "string" && value.length > 0);

    return values.length > 0 ? values : null;
}

function getFilterValue(filter: DataTableFilterMetaData | DataTableOperatorFilterMetaData | undefined): unknown {
    if (!filter) {
        return null;
    }

    if ("value" in filter) {
        return filter.value;
    }

    if ("constraints" in filter && filter.constraints.length > 0) {
        return filter.constraints[0]?.value;
    }

    return null;
}

export const getRegionFilterValue = (filters: DataTableFilterMeta | undefined): string[] | null =>
    sanitizeRegionFilter(getFilterValue(filters?.region));

export const createRegionFilterMeta = (regions: string[] | null): DataTableFilterMeta => ({
    region: {
        value: regions && regions.length > 0 ? regions : null,
        matchMode: FilterMatchMode.IN
    }
});

function getLocalStorage(): Storage | null {
    if (!("localStorage" in globalThis)) {
        return null;
    }

    try {
        return (globalThis as typeof globalThis & { localStorage: Storage }).localStorage;
    } catch {
        return null;
    }
}

export function loadPreferences(): StatisticTablePreferences | null {
    const storage = getLocalStorage();

    if (!storage) {
        return null;
    }

    try {
        const storedPreferences = storage.getItem(STATISTIC_TABLE_STORAGE_KEY);

        if (!storedPreferences) {
            return null;
        }

        const parsedPreferences = JSON.parse(storedPreferences) as Partial<StatisticTablePreferences> & {
            columnOrder?: unknown;
            visibleColumns?: unknown;
            regionFilter?: unknown;
        };
        const columnOrder = sanitizeColumnOrder(parsedPreferences.columnOrder);

        return {
            columnOrder,
            visibleColumns: sanitizeVisibleColumns(parsedPreferences.visibleColumns, columnOrder),
            regionFilter: sanitizeRegionFilter(parsedPreferences.regionFilter)
        } satisfies StatisticTablePreferences;
    } catch (error) {
        console.error("Не удалось прочитать настройки таблицы", error);

        return null;
    }
}

export function savePreferences(preferences: StatisticTablePreferences) {
    const storage = getLocalStorage();

    if (!storage) {
        return;
    }

    try {
        storage.setItem(STATISTIC_TABLE_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error("Не удалось сохранить настройки таблицы", error);
    }
}

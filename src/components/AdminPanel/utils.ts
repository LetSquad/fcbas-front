import { ReportData } from "@models/reports/types";

export function buildExportRows(reportData: ReportData[]) {
    return reportData.map((row) => ({
        "Дата вылета": row.date,
        "Код судна": row.aircraftCode,
        "Регион вылета": row.regionName
    }));
}

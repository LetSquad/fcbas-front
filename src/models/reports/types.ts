export interface ReportQueryParams {
    startDate?: string;
    finishDate?: string;
}

export interface ReportData {
    date: string;
    aircraftCode: string;
    regionName: string;
}

export interface RawReportResponse {
    flights: ReportData[];
}

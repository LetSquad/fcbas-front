import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@api/api";
import apiUrls from "@api/apiUrls";
import { ReportQueryParams } from "@models/reports/types";

if (process.env.WITH_MOCK) {
    await import("@mocks/report/mock").then((m) => m.setupReportMocks());
}

export const reportApi = createApi({
    reducerPath: "reportApi",
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        downloadReport: build.query<Blob, ReportQueryParams>({
            query: (queryParams) => ({ url: apiUrls.reportFlights(), params: queryParams, responseType: "blob" })
        })
    })
});

export const { useLazyDownloadReportQuery } = reportApi;

import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@api/api";
import apiUrls from "@api/apiUrls";

export const flightsApi = createApi({
    reducerPath: "flightsApi",
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        uploadFlightsData: build.query<void, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append("data", file);

                return {
                    url: apiUrls.flightData(),
                    method: "POST",
                    data: formData,
                    headers: { "Content-Disposition": file.name, "Content-Type": "multipart/form-data" }
                };
            }
        })
    })
});

export const { useLazyUploadFlightsDataQuery } = flightsApi;

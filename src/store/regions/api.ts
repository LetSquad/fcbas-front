import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@api/api";
import apiUrls from "@api/apiUrls";
import { RegionRecords, RegionsResponse } from "@models/regions/types";

if (process.env.WITH_MOCK) {
    await import("@mocks/regions/mock").then((m) => m.setupRegionsMocks());
}

export const regionsApi = createApi({
    reducerPath: "regionsApi",
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        getRegions: build.query<RegionRecords, void>({
            query: () => ({ url: apiUrls.regions() }),
            transformResponse: (response: RegionsResponse) => {
                const regions: RegionRecords = {};

                for (const region of response.regions) {
                    regions[region.id] = { ...region };
                }

                return regions;
            }
        }),
        uploadRegionsShape: build.query<void, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append("zip", file);

                return {
                    url: apiUrls.regionShape(),
                    method: "POST",
                    data: formData,
                    headers: { "Content-Disposition": file.name, "Content-Type": "multipart/form-data" }
                };
            }
        })
    })
});

export const { useGetRegionsQuery, useLazyUploadRegionsShapeQuery } = regionsApi;

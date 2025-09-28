import { mock } from "@api/api";
import apiUrls from "@api/apiUrls";
import { RegionsResponse } from "@models/regions/types";

export async function setupRegionsMocks() {
    const { default: regions } = await import("./regions.json");

    mock.onGet(apiUrls.regions()).reply(200, { regions } as RegionsResponse);
}

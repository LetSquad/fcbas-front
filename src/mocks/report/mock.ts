import { mock } from "@api/api";
import apiUrls from "@api/apiUrls";

export async function setupReportMocks() {
    const { default: report } = await import("./report.json");

    mock.onGet(apiUrls.reportFlights()).reply(
        200,
        new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json"
        })
    );
    mock.onGet(apiUrls.reportFlightsErp()).reply(200, { ...report });
}

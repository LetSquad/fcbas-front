import { TimeResolution } from "@models/analytics/enums";

export interface FormData {
    startDate: string;
    endDate: string;
    resolution: TimeResolution;
}

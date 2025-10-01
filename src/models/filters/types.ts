import { TimeResolution } from "@models/analytics/enums";

export interface FormData {
    startDate: string;
    finishDate: string;
    resolution: TimeResolution;
}

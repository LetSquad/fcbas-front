import { Interval } from "luxon";

import { TimeResolution } from "@models/analytics/enums";

export function getTimeResolutionLabelFromEnum(value: TimeResolution) {
    switch (value) {
        case TimeResolution.HOUR: {
            return "Час";
        }
        case TimeResolution.DAY: {
            return "День";
        }
        case TimeResolution.MONTH: {
            return "Месяц";
        }
        // skip default
    }
}

export function getTimeResolutionDescriptionFromEnum(value: TimeResolution) {
    switch (value) {
        case TimeResolution.HOUR: {
            return "(в час)";
        }
        case TimeResolution.DAY: {
            return "(в день)";
        }
        case TimeResolution.MONTH: {
            return "(в месяц)";
        }
        // skip default
    }
}

export function isDisabledByTimeResolutionEnum(value: TimeResolution, interval: Interval) {
    switch (value) {
        case TimeResolution.HOUR: {
            return false;
        }
        case TimeResolution.DAY: {
            return (interval.toDuration("days").toObject().days as number) < 2;
        }
        case TimeResolution.MONTH: {
            return (interval.toDuration("months").toObject().months as number) < 2;
        }
        // skip default
    }
}

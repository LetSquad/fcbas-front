import { useEffect, useMemo } from "react";

import { useFormikContext } from "formik";
import { DateTime, Interval } from "luxon";
import { Button, Form } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import FormField from "@commonComponents/FormField";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getTimeResolutionLabelFromEnum, isDisabledByTimeResolutionEnum } from "@components/Dashboard/utils";
import { TimeResolution } from "@models/analytics/enums";
import { FormData } from "@models/filters/types";
import { FormFieldType } from "@models/forms/enums";
import { DropdownOption } from "@models/forms/types";
import {
    useGetAverageCountByRegionQuery,
    useGetAverageCountQuery,
    useGetAverageDurationByRegionQuery,
    useGetAverageDurationQuery,
    useGetCountByRegionQuery,
    useGetCountQuery,
    useGetDensityByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetTimeDistributionQuery,
    useGetTrendQuery
} from "@store/analytics/api";

import styles from "./styles/Filters.module.scss";

const TIME_RESOLUTION_OPTIONS: (interval: Interval) => DropdownOption[] = (interval) =>
    Object.values(TimeResolution).map((timeResolution) => ({
        value: timeResolution,
        text: getTimeResolutionLabelFromEnum(timeResolution),
        disabled: isDisabledByTimeResolutionEnum(timeResolution, interval)
    }));

export default function Filters() {
    const formik = useFormikContext<FormData>();

    const formData = useFilterFormContext();

    const { isLoading: isCountByRegionsLoading, isFetching: isCountByRegionsFetching } = useGetCountByRegionQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });
    const { isLoading: isAverageDurationByRegionsLoading, isFetching: isAverageDurationByRegionsFetching } =
        useGetAverageDurationByRegionQuery({ startDate: formData.startDate, endDate: formData.endDate });
    const { isLoading: isAverageCountByRegionsLoading, isFetching: isAverageCountByRegionsFetching } =
        useGetAverageCountByRegionQuery(formData);
    const { isLoading: isEmptyDaysByRegionsLoading, isFetching: isEmptyDaysByRegionsFetching } = useGetEmptyDaysByRegionQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });
    const { isLoading: isDensityByRegionsLoading, isFetching: isDensityByRegionsFethcing } = useGetDensityByRegionQuery(formData);
    const { isLoading: isAverageCountLoading, isFetching: isAverageCountFetching } = useGetAverageCountQuery(formData);
    const { isLoading: isAverageDurationLoading, isFetching: isAverageDurationFetching } = useGetAverageDurationQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });
    const { isLoading: isCountLoading, isFetching: isCountFetching } = useGetCountQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });
    const { isLoading: isTimeDistributionsLoading, isFetching: isTimeDistributionsFetching } = useGetTimeDistributionQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });
    const { isLoading: isTrendLoading, isFetching: isTrendFetching } = useGetTrendQuery({
        startDate: formData.startDate,
        endDate: formData.endDate
    });

    const isLoading =
        isCountByRegionsLoading ||
        isCountByRegionsFetching ||
        isAverageDurationByRegionsLoading ||
        isAverageDurationByRegionsFetching ||
        isAverageCountByRegionsLoading ||
        isAverageCountByRegionsFetching ||
        isEmptyDaysByRegionsLoading ||
        isEmptyDaysByRegionsFetching ||
        isDensityByRegionsLoading ||
        isDensityByRegionsFethcing ||
        isAverageCountLoading ||
        isAverageCountFetching ||
        isAverageDurationLoading ||
        isAverageDurationFetching ||
        isCountLoading ||
        isCountFetching ||
        isTimeDistributionsLoading ||
        isTimeDistributionsFetching ||
        isTrendLoading ||
        isTrendFetching;

    const interval = useMemo(
        () => Interval.fromDateTimes(DateTime.fromISO(formik.values.startDate), DateTime.fromISO(formik.values.endDate)),
        [formik.values.endDate, formik.values.startDate]
    );

    useEffect(() => {
        console.log(interval);
        if ((interval.toDuration("days").toObject().days as number) < 2) {
            formik.setFieldValue("resolution", TimeResolution.HOUR);
            return;
        }

        if ((interval.toDuration("months").toObject().months as number) < 2) {
            formik.setFieldValue("resolution", TimeResolution.DAY);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interval]);

    return (
        <Form>
            <Flex columnGap="10px" alignItemsEnd className={styles.container}>
                <FormField name="startDate" label="Начало периода" type={FormFieldType.DATEPICKER} />
                <FormField name="endDate" label="Конец периода" maxDate={new Date()} type={FormFieldType.DATEPICKER} />
                <FormField
                    name="resolution"
                    label="Промежуток измерения"
                    type={FormFieldType.DROPDOWN}
                    options={TIME_RESOLUTION_OPTIONS(interval)}
                    placeholder="Выберите промежуток измерения"
                />
                <Button
                    type="submit"
                    disabled={JSON.stringify(formik.values) === JSON.stringify(formData)}
                    onClick={formik.submitForm}
                    primary
                    className={styles.button}
                    loading={isLoading}
                >
                    Применить
                </Button>
            </Flex>
        </Form>
    );
}

import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

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
import { analyticsApi } from "@store/analytics/api";

import styles from "./styles/Filters.module.scss";

const TIME_RESOLUTION_OPTIONS: (interval: Interval) => DropdownOption[] = (interval) =>
    Object.values(TimeResolution).map((timeResolution) => ({
        value: timeResolution,
        text: getTimeResolutionLabelFromEnum(timeResolution),
        disabled: isDisabledByTimeResolutionEnum(timeResolution, interval)
    }));

export const INITIAL_FORM_DATA: () => FormData = () => ({
    startDate: DateTime.now().startOf("year").toISODate(),
    finishDate: DateTime.now().toISODate(),
    resolution: TimeResolution.MONTH
});

export default function Filters() {
    const formik = useFormikContext<FormData>();

    const formData = useFilterFormContext();

    const countByRegionsInfo = useSelector(
        analyticsApi.endpoints.getCountByRegion.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const countInfo = useSelector(
        analyticsApi.endpoints.getCount.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const averageDurationByRegionsInfo = useSelector(
        analyticsApi.endpoints.getAverageDurationByRegion.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const averageDurationInfo = useSelector(
        analyticsApi.endpoints.getAverageDuration.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const averageCountByRegionsInfo = useSelector(analyticsApi.endpoints.getAverageCountByRegion.select(formData));
    const averageCountInfo = useSelector(analyticsApi.endpoints.getAverageCount.select(formData));
    const maxCountByRegionsInfo = useSelector(analyticsApi.endpoints.getMaxCountByRegion.select(formData));
    const maxCountInfo = useSelector(analyticsApi.endpoints.getMaxCount.select(formData));
    const emptyDaysByRegionsInfo = useSelector(
        analyticsApi.endpoints.getEmptyDaysByRegion.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const densityByRegionsInfo = useSelector(
        analyticsApi.endpoints.getDensityByRegion.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const timeDistributionsByRegionsInfo = useSelector(
        analyticsApi.endpoints.getTimeDistributionByRegion.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const timeDistributionsInfo = useSelector(
        analyticsApi.endpoints.getTimeDistribution.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );
    const trendInfo = useSelector(
        analyticsApi.endpoints.getTrend.select({
            startDate: formData.startDate,
            finishDate: formData.finishDate
        })
    );

    const isLoading =
        countByRegionsInfo.isLoading ||
        countInfo.isLoading ||
        averageDurationByRegionsInfo.isLoading ||
        averageDurationInfo.isLoading ||
        averageCountByRegionsInfo.isLoading ||
        averageCountInfo.isLoading ||
        maxCountByRegionsInfo.isLoading ||
        maxCountInfo.isLoading ||
        emptyDaysByRegionsInfo.isLoading ||
        densityByRegionsInfo.isLoading ||
        trendInfo.isLoading ||
        timeDistributionsByRegionsInfo.isLoading ||
        timeDistributionsInfo.isLoading;

    const interval = useMemo(
        () => Interval.fromDateTimes(DateTime.fromISO(formik.values.startDate), DateTime.fromISO(formik.values.finishDate)),
        [formik.values.finishDate, formik.values.startDate]
    );

    useEffect(() => {
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
        <Form className={styles.form}>
            <Flex columnGap="10px" alignItemsEnd className={styles.container}>
                <FormField
                    className={styles.field}
                    name="startDate"
                    label="Начало периода"
                    type={FormFieldType.DATEPICKER}
                    maxDate={formik.values.finishDate ? DateTime.fromISO(formik.values.finishDate).toJSDate() : undefined}
                />
                <FormField
                    className={styles.field}
                    name="finishDate"
                    label="Конец периода"
                    minDate={formik.values.startDate ? DateTime.fromISO(formik.values.startDate).toJSDate() : undefined}
                    maxDate={new Date()}
                    type={FormFieldType.DATEPICKER}
                />
                <FormField
                    className={styles.field}
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
                <Button
                    type="button"
                    disabled={JSON.stringify(formik.values) === JSON.stringify(INITIAL_FORM_DATA())}
                    onClick={() => formik.resetForm()}
                    basic
                    className={styles.button}
                >
                    Сбросить
                </Button>
            </Flex>
        </Form>
    );
}

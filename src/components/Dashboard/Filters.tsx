import { useCallback, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";

import { useFormikContext } from "formik";
import { DateTime, Interval } from "luxon";
import { Button, Dropdown, DropdownItem, DropdownMenu, Form } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import FormField from "@commonComponents/FormField";
import { useFilterForm } from "@components/Dashboard/context";
import { getTimeResolutionLabelFromEnum, isDisabledByTimeResolutionEnum } from "@components/Dashboard/utils";
import { TimeResolution } from "@models/analytics/enums";
import { FormData } from "@models/filters/types";
import { FormFieldType } from "@models/forms/enums";
import { DropdownOption } from "@models/forms/types";
import { analyticsApi } from "@store/analytics/api";
import { RootState } from "@store/index";

import styles from "./styles/Filters.module.scss";

interface QuickFilterPreset {
    id: string;
    label: string;
    getValues: () => FormData;
}

const QUICK_FILTER_PRESETS: QuickFilterPreset[] = [
    {
        id: "lastDay",
        label: "Последние 24 часа",
        getValues: () => {
            const finishDate = DateTime.now();
            const startDate = finishDate.minus({ days: 1 });

            return {
                startDate: startDate.toISODate(),
                finishDate: finishDate.toISODate(),
                resolution: TimeResolution.HOUR
            };
        }
    },
    {
        id: "lastWeek",
        label: "Последние 7 дней",
        getValues: () => {
            const finishDate = DateTime.now();
            const startDate = finishDate.minus({ days: 6 });

            return {
                startDate: startDate.toISODate(),
                finishDate: finishDate.toISODate(),
                resolution: TimeResolution.DAY
            };
        }
    },
    {
        id: "lastMonth",
        label: "Последние 30 дней",
        getValues: () => {
            const finishDate = DateTime.now();
            const startDate = finishDate.minus({ days: 29 });

            return {
                startDate: startDate.toISODate(),
                finishDate: finishDate.toISODate(),
                resolution: TimeResolution.DAY
            };
        }
    },
    {
        id: "year",
        label: "Год",
        getValues: () => {
            const finishDate = DateTime.now();
            const startDate = finishDate.minus({ year: 1 }).plus({ days: 1 });

            return {
                startDate: startDate.toISODate(),
                finishDate: finishDate.toISODate(),
                resolution: TimeResolution.MONTH
            };
        }
    },
    {
        id: "currentYear",
        label: "Текущий год",
        getValues: () => {
            const finishDate = DateTime.now();
            const startDate = finishDate.startOf("year");

            return {
                startDate: startDate.toISODate(),
                finishDate: finishDate.toISODate(),
                resolution: TimeResolution.MONTH
            };
        }
    }
];

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

const areFiltersEqual = (left: FormData, right: FormData) =>
    left.startDate === right.startDate && left.finishDate === right.finishDate && left.resolution === right.resolution;

export default function Filters() {
    const formik = useFormikContext<FormData>();

    const formData = useFilterForm();

    const dateRangeArgs = useMemo(
        () => ({ startDate: formData.startDate, finishDate: formData.finishDate }),
        [formData.finishDate, formData.startDate]
    );

    const resolutionArgs = useMemo(() => ({ ...dateRangeArgs, resolution: formData.resolution }), [dateRangeArgs, formData.resolution]);

    const dateRangeSelectors = useMemo(
        () => [
            analyticsApi.endpoints.getCountByRegion.select(dateRangeArgs),
            analyticsApi.endpoints.getCount.select(dateRangeArgs),
            analyticsApi.endpoints.getAverageDurationByRegion.select(dateRangeArgs),
            analyticsApi.endpoints.getAverageDuration.select(dateRangeArgs),
            analyticsApi.endpoints.getEmptyDaysByRegion.select(dateRangeArgs),
            analyticsApi.endpoints.getDensityByRegion.select(dateRangeArgs),
            analyticsApi.endpoints.getTimeDistributionByRegion.select(dateRangeArgs),
            analyticsApi.endpoints.getTimeDistribution.select(dateRangeArgs),
            analyticsApi.endpoints.getTrend.select(dateRangeArgs)
        ],
        [dateRangeArgs]
    );

    const resolutionSelectors = useMemo(
        () => [
            analyticsApi.endpoints.getAverageCountByRegion.select(resolutionArgs),
            analyticsApi.endpoints.getAverageCount.select(resolutionArgs),
            analyticsApi.endpoints.getMaxCountByRegion.select(resolutionArgs),
            analyticsApi.endpoints.getMaxCount.select(resolutionArgs)
        ],
        [resolutionArgs]
    );

    const isLoading = useSelector(
        (state: RootState) =>
            dateRangeSelectors.some((select) => select(state).isLoading) || resolutionSelectors.some((select) => select(state).isLoading)
    );
    const isApplyDisabled = useMemo(() => areFiltersEqual(formik.values, formData), [formData, formik.values]);

    const handlePresetSelect = useCallback(
        (preset: QuickFilterPreset) => {
            const presetValues = preset.getValues();
            const shouldSubmit = !areFiltersEqual(formData, presetValues);

            flushSync(() => {
                formik.setValues(presetValues, false);
                formik.setTouched({}, false);
            });

            if (shouldSubmit) {
                formik.submitForm().catch(() => undefined);
            }
        },
        [formData, formik]
    );

    const interval = useMemo(
        () => Interval.fromDateTimes(DateTime.fromISO(formik.values.startDate), DateTime.fromISO(formik.values.finishDate)),
        [formik.values.finishDate, formik.values.startDate]
    );

    useEffect(() => {
        const { resolution } = formik.values;
        const days = interval.toDuration("days").days ?? 0;

        if (days < 2) {
            if (resolution !== TimeResolution.HOUR) {
                formik.setFieldValue("resolution", TimeResolution.HOUR);
            }
            return;
        }

        const months = interval.toDuration("months").months ?? 0;

        if (months < 2 && resolution === TimeResolution.MONTH) {
            formik.setFieldValue("resolution", TimeResolution.DAY);
        }
    }, [formik, interval]);

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
                    className={styles.fieldDropdown}
                    name="resolution"
                    label="Промежуток измерения"
                    type={FormFieldType.DROPDOWN}
                    options={TIME_RESOLUTION_OPTIONS(interval)}
                    placeholder="Выберите промежуток измерения"
                />
                <Button
                    type="submit"
                    disabled={isApplyDisabled || isLoading}
                    onClick={formik.submitForm}
                    primary
                    className={styles.button}
                    loading={isLoading}
                >
                    Применить
                </Button>

                <Dropdown text="Периоды" button className={styles.button} loading={isLoading} disabled={isLoading}>
                    <DropdownMenu>
                        {QUICK_FILTER_PRESETS.map((preset) => (
                            <DropdownItem key={preset.id} onClick={() => handlePresetSelect(preset)}>
                                {preset.label}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </Flex>
        </Form>
    );
}

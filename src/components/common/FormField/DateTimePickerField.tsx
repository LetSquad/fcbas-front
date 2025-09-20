import "./styles/DatePickerField.module.scss";

import { useCallback, useMemo } from "react";

import classNames from "classnames";
import { useField } from "formik";
import { DateTime } from "luxon";
import { Label } from "semantic-ui-react";

import { isSameDate } from "@coreUtils/utils";
import { DateTimePickerFieldProps } from "@models/forms/types";

const { ru } = await import(/* webpackChunkName: "date-fns-ru" */ "date-fns/locale/ru");

const datePicker = await import(/* webpackChunkName: "react-datepicker" */ "react-datepicker");
const DatePicker = datePicker.default;

datePicker.registerLocale("ru-RU", ru);

export default function DateTimePickerField({
    name,
    label,
    className,
    placeholder,
    required = false,
    maxDate,
    minDate,
    minTime,
    maxTime,
    dateFormat = "dd.MM.yyyy HH:mm",
    timeFormat = "HH:mm",
    timeCaption = "Время",
    timeIntervals = 15,
    includeTimes,
    includeDates,
    filterTimes,
    onChange: additionalOnChange,
    popperPlacement,
    disabled = false
}: DateTimePickerFieldProps) {
    const [{ value }, { error, touched }, { setValue, setTouched }] = useField<string | undefined>({ name, type: "select" });

    const formatJSDate = useCallback((date: Date | null) => (date ? (DateTime.fromJSDate(date).toISO() as string) : undefined), []);

    const setTouchedTrue = useCallback(() => setTouched(true), [setTouched]);

    const changeDateTimeValue = useCallback(
        (date: Date | null) => {
            const formatTime = formatJSDate(date);

            if (additionalOnChange) {
                additionalOnChange(formatTime);
            }

            setValue(formatTime);
        },
        [additionalOnChange, formatJSDate, setValue]
    );

    const resetDateValue = useCallback(() => {
        if (includeTimes && value) {
            const valueDate = DateTime.fromISO(value);
            if (!includeTimes.some((includeTime) => DateTime.fromJSDate(includeTime) === valueDate)) {
                setValue(undefined);
            }
        }
    }, [includeTimes, setValue, value]);

    const includesTimesInDay = useMemo(() => {
        if (includeTimes && !value) {
            return [];
        }

        if (includeTimes && value) {
            return includeTimes.filter((includeTime) => isSameDate(DateTime.fromJSDate(includeTime), DateTime.fromISO(value)));
        }

        return undefined;
    }, [includeTimes, value]);

    const isErrorDisplay = useMemo(() => Boolean(error && (touched || (!touched && value))), [error, touched, value]);

    return (
        <div
            className={classNames(
                "field",
                {
                    required,
                    disabled,
                    error: isErrorDisplay
                },
                className
            )}
        >
            {label && (
                <label htmlFor={name} className="label">
                    {label}
                </label>
            )}
            <DatePicker
                disabledKeyboardNavigation
                name={name}
                disabled={disabled}
                selected={value ? DateTime.fromISO(value).toJSDate() : undefined}
                onSelect={changeDateTimeValue}
                onChange={changeDateTimeValue}
                maxDate={maxDate}
                minDate={minDate}
                minTime={minTime}
                maxTime={maxTime}
                showMonthDropdown
                showYearDropdown
                showTimeSelect
                locale="ru-RU"
                placeholderText={placeholder}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                timeCaption={timeCaption}
                timeIntervals={timeIntervals}
                required={required}
                includeTimes={includesTimesInDay}
                includeDates={includeDates}
                onClickOutside={resetDateValue}
                onBlur={setTouchedTrue}
                popperPlacement={popperPlacement}
                filterTime={filterTimes}
            />
            {isErrorDisplay && (
                <Label pointing prompt>
                    {error}
                </Label>
            )}
        </div>
    );
}

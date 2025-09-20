import "./styles/TimePickerField.module.scss";

import { useCallback, useMemo } from "react";

import classNames from "classnames";
import { useField } from "formik";
import { DateTime } from "luxon";
import { Label } from "semantic-ui-react";

import { TimePickerFieldProps } from "@models/forms/types";

const { ru } = await import(/* webpackChunkName: "date-fns-ru" */ "date-fns/locale/ru");

const datePicker = await import(/* webpackChunkName: "react-datepicker" */ "react-datepicker");
const DatePicker = datePicker.default;

datePicker.registerLocale("ru-RU", ru);

export default function TimePickerField({
    name,
    label,
    className,
    placeholder,
    required = false,
    timeCaption = "Время",
    timeIntervals = 15,
    timeFormat = "HH:mm",
    maxTime,
    minTime,
    onChange: additionalOnChange,
    popperPlacement,
    disabled = false,
    includeTimes
}: TimePickerFieldProps) {
    const [{ value }, { error, touched }, { setValue, setTouched }] = useField<string | undefined>({ name, type: "select" });

    const formatJSDate = useCallback((date: Date | null) => (date ? (DateTime.fromJSDate(date).toISOTime() as string) : undefined), []);

    const setTouchedTrue = useCallback(() => setTouched(true), [setTouched]);

    const changeTimeValue = useCallback(
        (date: Date | null) => {
            const formatTime = formatJSDate(date);

            if (additionalOnChange) {
                additionalOnChange(formatTime);
            }

            setValue(formatTime);
        },
        [additionalOnChange, formatJSDate, setValue]
    );

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
                name={name}
                disabled={disabled}
                selected={value ? DateTime.fromISO(value).toJSDate() : undefined}
                onSelect={changeTimeValue}
                onChange={changeTimeValue}
                locale="ru-RU"
                placeholderText={placeholder}
                dateFormat={timeFormat}
                timeFormat={timeFormat}
                timeCaption={timeCaption}
                maxTime={maxTime}
                minTime={minTime}
                showTimeSelect
                timeIntervals={timeIntervals}
                required={required}
                showTimeSelectOnly
                onBlur={setTouchedTrue}
                popperPlacement={popperPlacement}
                includeTimes={includeTimes}
            />
            {isErrorDisplay && (
                <Label pointing prompt>
                    {error}
                </Label>
            )}
        </div>
    );
}

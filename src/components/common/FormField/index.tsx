import { lazy, useMemo } from "react";

import { Form, Input, Label } from "semantic-ui-react";

import { WithSuspense } from "@coreUtils/WithSuspense";
import { FormFieldType } from "@models/forms/enums";
import { FormFieldProps } from "@models/forms/types";

import FormFieldPlaceholder from "./Placeholders";
import styles from "./styles/FormField.module.scss";

const DatePickerField = lazy(/* webpackChunkName: "DatePickerField" */ () => import("./DatePickerField"));
const TimePickerField = lazy(/* webpackChunkName: "TimePickerField" */ () => import("./TimePickerField"));
const DateTimePickerField = lazy(/* webpackChunkName: "DateTimePickerField" */ () => import("./DateTimePickerField"));
const InputField = lazy(/* webpackChunkName: "InputField" */ () => import("./InputField"));
const DropdownField = lazy(/* webpackChunkName: "DropdownField" */ () => import("./DropdownField"));
const CheckboxField = lazy(/* webpackChunkName: "CheckboxField" */ () => import("./CheckboxField"));

export default function FormField({ defaultValue, isLoading, errorText, basicError, promptError, errorColor, ...props }: FormFieldProps) {
    const field = useMemo(() => {
        switch (props.type) {
            case FormFieldType.INPUT: {
                return <InputField {...props} />;
            }
            case FormFieldType.DROPDOWN: {
                return <DropdownField {...props} />;
            }
            case FormFieldType.DATEPICKER: {
                return <DatePickerField {...props} />;
            }
            case FormFieldType.TIMEPICKER: {
                return <TimePickerField {...props} />;
            }
            case FormFieldType.DATE_TIMEPICKER: {
                return <DateTimePickerField {...props} />;
            }
            case FormFieldType.CHECKBOX: {
                return <CheckboxField {...props} />;
            }
            // skip default
        }
    }, [props]);

    if (defaultValue || isLoading || errorText) {
        return (
            <Form.Field className={props.className}>
                <label className={props.required ? styles.prepareFormFieldLabelRequired : undefined} htmlFor={props.name}>
                    {props.label}
                </label>
                <Input id={props.name} disabled placeholder={props.placeholder} defaultValue={defaultValue} loading={isLoading} />
                {errorText && (
                    <Label pointing prompt={promptError} basic={basicError} color={errorColor}>
                        {errorText}
                    </Label>
                )}
            </Form.Field>
        );
    }

    return <WithSuspense loader={<FormFieldPlaceholder />}>{field}</WithSuspense>;
}

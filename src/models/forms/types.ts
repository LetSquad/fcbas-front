import React from "react";

import { LabelProps } from "semantic-ui-react/dist/commonjs/elements/Label";
import { SemanticCOLORS, SemanticShorthandItem } from "semantic-ui-react/dist/commonjs/generic";

import { Placement } from "@floating-ui/react";

import { FormFieldType } from "./enums";

export interface BaseFieldProps {
    name: string;
    className?: string;
    label?: string;
    placeholder?: string;
    nullAvatar?: string;
    required?: boolean;
    isLoading?: boolean;
    errorText?: string | React.JSX.Element;
    promptError?: boolean;
    basicError?: boolean;
    errorColor?: SemanticCOLORS;
    defaultValue?: string;
}

export interface BaseFieldPropsWithDisabled extends BaseFieldProps {
    disabled?: boolean;
}

export interface BaseInputFieldProps extends BaseFieldPropsWithDisabled {
    onChange?: (value: string) => void;
    clearable?: boolean;
    inputLabel?: SemanticShorthandItem<LabelProps>;
    labelPosition?: "left" | "right" | "left corner" | "right corner";
    maxLength?: number;
}

export interface NumberInputFieldProps extends BaseInputFieldProps {
    inputType: "number";
    max?: number;
    min?: number;
    step?: number;
}

export type InputFieldProps = NumberInputFieldProps | BaseInputFieldProps;

export interface DropdownOption {
    text: string;
    value: string | number | boolean;
    content?: string | React.JSX.Element;
}

export interface DropdownFieldProps extends BaseFieldPropsWithDisabled {
    options: DropdownOption[];
    search?: boolean;
    allowAdditions?: boolean;
    clearable?: boolean;
    multiple?: boolean;
}

export interface DatePickerFieldProps extends BaseFieldPropsWithDisabled {
    onChange?: (value?: string) => void;
    maxDate?: Date;
    minDate?: Date;
    dateFormat?: string;
    popperPlacement?: Placement;
    includeDates?: Date[];
}

export interface TimePickerFieldProps extends BaseFieldPropsWithDisabled {
    onChange?: (value?: string) => void;
    timeCaption?: string;
    timeFormat?: string;
    maxTime?: Date;
    minTime?: Date;
    timeIntervals?: number;
    popperPlacement?: Placement;
    includeTimes?: Date[];
    filterTimes?: (date: Date) => boolean;
}

export type DateTimePickerFieldProps = BaseFieldPropsWithDisabled &
    DatePickerFieldProps &
    TimePickerFieldProps & {
        includeTimes?: Date[];
        includeDates?: Date[];
    };

export type FormFieldProps =
    | (InputFieldProps & { type: FormFieldType.INPUT })
    | (DropdownFieldProps & { type: FormFieldType.DROPDOWN })
    | (DatePickerFieldProps & { type: FormFieldType.DATEPICKER })
    | (TimePickerFieldProps & { type: FormFieldType.TIMEPICKER })
    | (DateTimePickerFieldProps & { type: FormFieldType.DATE_TIMEPICKER })
    | (BaseFieldPropsWithDisabled & { type: FormFieldType.CHECKBOX });

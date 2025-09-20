import { ChangeEvent, useCallback, useMemo } from "react";

import { useField } from "formik";
import { Form, Icon, Input, Label } from "semantic-ui-react";
import { InputOnChangeData } from "semantic-ui-react/dist/commonjs/elements/Input/Input";

import { InputFieldProps } from "@models/forms/types";

export default function InputField({
    name,
    label,
    className,
    placeholder,
    required = false,
    inputLabel,
    labelPosition,
    clearable = true,
    maxLength,
    disabled = false,
    onChange: additionalOnChange,
    ...props
}: InputFieldProps) {
    const [{ value, onBlur, onChange }, { error, touched }, { setValue }] = useField<string | undefined>(name);

    const clearSearch = useCallback(() => setValue(""), [setValue]);

    const isErrorDisplay = useMemo(() => Boolean(error && (touched || (!touched && value))), [error, touched, value]);

    const onChangeValue = useCallback(
        (event: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
            if (additionalOnChange) {
                additionalOnChange(data.value);
            }
            onChange(event);
        },
        [additionalOnChange, onChange]
    );

    return (
        <Form.Field error={isErrorDisplay} required={required} className={className} disabled={disabled}>
            {label && <label htmlFor={name}>{label}</label>}
            <Input
                id={name}
                label={inputLabel}
                labelPosition={labelPosition}
                name={name}
                disabled={disabled}
                value={value === undefined || value === null ? "" : value}
                onChange={onChangeValue}
                onBlur={onBlur}
                placeholder={placeholder}
                type={"inputType" in props ? props.inputType : undefined}
                max={"max" in props ? props.max : undefined}
                min={"min" in props ? props.min : undefined}
                step={"step" in props ? props.step : undefined}
                icon={!("inputType" in props) && clearable && value ? <Icon name="remove" link onClick={clearSearch} /> : undefined}
                maxLength={maxLength}
            />
            {isErrorDisplay && (
                <Label pointing prompt>
                    {error}
                </Label>
            )}
        </Form.Field>
    );
}

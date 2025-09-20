import { useMemo, useState } from "react";

import { useField } from "formik";
import { Form } from "semantic-ui-react";

import { DropdownFieldProps } from "@models/forms/types";

export default function DropdownField({
    name,
    className,
    label,
    placeholder,
    required = false,
    options,
    search = false,
    allowAdditions = false,
    clearable = false,
    multiple = false,
    disabled = false
}: DropdownFieldProps) {
    const [{ value: fieldValue }, { error, touched }, { setValue, setTouched }] = useField<string | undefined>({
        name,
        type: "select"
    });

    const [addedItem, setAddedItem] = useState<string>();

    const fullOptions = useMemo(() => (addedItem ? [...options, { value: addedItem, text: addedItem }] : options), [addedItem, options]);

    const isErrorDisplay = useMemo(() => Boolean(error && (touched || (!touched && fieldValue))), [error, touched, fieldValue]);

    const value = useMemo(() => {
        if (fieldValue === undefined || fieldValue === null) {
            return multiple ? [] : "";
        }

        return fieldValue;
    }, [fieldValue, multiple]);

    return (
        <Form.Dropdown
            disabled={disabled}
            label={label}
            value={value}
            options={fullOptions}
            onChange={(_event, data) => setValue(data.value as string)}
            onBlur={(_event, data) => {
                setValue(data.value as string);
                setTouched(true);
            }}
            onAddItem={(_event, data) => {
                setAddedItem(data.value as string);
                setValue(data.value as string);
            }}
            placeholder={placeholder}
            required={required}
            error={isErrorDisplay ? error : undefined}
            selection
            search={search}
            allowAdditions={allowAdditions}
            additionLabel=""
            clearable={clearable}
            className={className}
            multiple={multiple}
            noResultsMessage="Результаты не найдены"
        />
    );
}

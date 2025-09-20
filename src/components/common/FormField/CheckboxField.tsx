import { useCallback, useMemo } from "react";

import { useField } from "formik";
import { Checkbox, Form, Label } from "semantic-ui-react";

import { BaseFieldPropsWithDisabled } from "@models/forms/types";

import styles from "./styles/CheckboxField.module.scss";

export default function CheckboxField({ name, label, className, required = false, disabled = false }: BaseFieldPropsWithDisabled) {
    const [{ value }, { error, touched }, { setValue, setTouched }] = useField<boolean>(name);

    const isErrorDisplay = useMemo(() => Boolean(error && (touched || (!touched && value))), [error, touched, value]);

    const onClick = useCallback(() => {
        setValue(!value);
        setTouched(true);
    }, [setTouched, setValue, value]);

    return (
        <Form.Field error={isErrorDisplay} required={required} className={className}>
            <div className={styles.container}>
                <Checkbox className={styles.checkbox} label={label} onChange={onClick} checked={value} disabled={disabled} />
            </div>
            {isErrorDisplay && (
                <Label pointing prompt>
                    {error}
                </Label>
            )}
        </Form.Field>
    );
}

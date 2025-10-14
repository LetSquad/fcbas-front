import { useMemo, useState } from "react";

import classNames from "classnames";
import { Button, Checkbox, Dropdown } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import type { DropdownOption } from "@models/forms/types";

import styles from "./styles/ButtonDropdown.module.scss";

export interface ColumnVisibilityDropdownProps {
    options: DropdownOption[];
    selected: (string | number | boolean)[];
    onChange: (nextSelected: (string | number | boolean)[]) => void;
    buttonText: string;
    disabled?: boolean;
    className?: string;
}

export default function ColumnVisibilityDropdown({
    options,
    selected,
    onChange,
    buttonText,
    disabled,
    className
}: ColumnVisibilityDropdownProps) {
    const [open, setOpen] = useState(false);

    const isAllSelected = useMemo(() => options.every((option) => selected.includes(option.value)), [options, selected]);

    const toggleValue = (value: string | number | boolean) => {
        const exists = selected.includes(value);
        const next = exists ? selected.filter((v) => v !== value) : [...selected, value];

        onChange(next);
    };

    const selectAll = () => {
        onChange(options.map((option) => option.value));
    };

    const clearAll = () => {
        onChange([]);
    };

    const selectedCount = selected.length;

    return (
        <Dropdown
            className={className}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            text={`${buttonText} (${selectedCount})`}
            button
            direction="left"
            scrolling
            disabled={disabled}
            closeOnChange={false}
            closeOnBlur={false}
        >
            <Dropdown.Menu className={styles.dropdownMenu}>
                <Flex className={styles.buttonContainer} columnGap="8px" alignItemsCenter justifyCenter>
                    <Button className={styles.button} size="tiny" primary onClick={selectAll} disabled={isAllSelected}>
                        Выбрать все
                    </Button>
                    <Button className={styles.button} size="tiny" secondary onClick={clearAll} disabled={selected.length === 0}>
                        Сбросить
                    </Button>
                </Flex>

                <Dropdown.Divider className={styles.divider} />

                {options.map((option) => (
                    <Dropdown.Item
                        key={option.value.toString()}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                    >
                        <Flex
                            alignItemsCenter
                            columnGap="10px"
                            className={classNames({ [styles.checkboxContainer]: !disabled })}
                            onClick={() => toggleValue(option.value)}
                            role="button"
                            tabIndex={0}
                        >
                            <Checkbox
                                checked={selected.includes(option.value)}
                                disabled={disabled}
                                onChange={() => toggleValue(option.value)}
                            />
                            <span>{option.text}</span>
                        </Flex>
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}

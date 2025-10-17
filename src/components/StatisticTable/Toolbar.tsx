import { Dropdown, DropdownItem, DropdownMenu } from "semantic-ui-react";

import ColumnVisibilityDropdown from "@commonComponents/ButtonDropdown";
import Flex from "@commonComponents/Flex";
import type { TableColumnKey } from "@models/analytics/types";

import styles from "./styles/Toolbar.module.scss";

interface ColumnOption {
    text: string;
    value: TableColumnKey;
}

interface ToolbarProps {
    isDisabled: boolean;
    onExportCSV: () => void;
    onExportXLSX: () => void;
    onExportPDF: () => void;
    columnOptions: ColumnOption[];
    visibleColumns: TableColumnKey[];
    onVisibleColumnsChange: (columns: TableColumnKey[]) => void;
}

export default function Toolbar({
    isDisabled,
    onExportCSV,
    onExportXLSX,
    onExportPDF,
    columnOptions,
    visibleColumns,
    onVisibleColumnsChange
}: ToolbarProps) {
    return (
        <Flex columnGap="10px" justifyEnd className={styles.container}>
            <Dropdown text="Экспорт" button disabled={isDisabled} className={styles.dropdown}>
                <DropdownMenu>
                    <DropdownItem onClick={onExportXLSX}>Экспорт XLSX</DropdownItem>
                    <DropdownItem onClick={onExportPDF}>Экспорт PDF</DropdownItem>
                    <DropdownItem onClick={onExportCSV}>Экспорт CSV</DropdownItem>
                </DropdownMenu>
            </Dropdown>
            <ColumnVisibilityDropdown
                selected={visibleColumns}
                options={columnOptions}
                onChange={(nextSelected) => onVisibleColumnsChange(nextSelected as TableColumnKey[])}
                buttonText="Колонки"
                className={styles.button}
            />
        </Flex>
    );
}

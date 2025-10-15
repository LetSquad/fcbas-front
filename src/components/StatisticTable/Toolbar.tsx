import { Button } from "semantic-ui-react";

import ColumnVisibilityDropdown from "@commonComponents/ButtonDropdown";
import Flex from "@commonComponents/Flex";
import type { TableColumnKey } from "@models/analytics/types";

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
        <Flex columnGap="10px" justifyEnd>
            <Button onClick={onExportXLSX} disabled={isDisabled} primary size="small">
                Экспорт XLSX
            </Button>
            <Button onClick={onExportPDF} disabled={isDisabled} secondary size="small">
                Экспорт PDF
            </Button>
            <Button onClick={onExportCSV} disabled={isDisabled} size="small">
                Экспорт CSV
            </Button>
            <ColumnVisibilityDropdown
                selected={visibleColumns}
                options={columnOptions}
                onChange={(nextSelected) => onVisibleColumnsChange(nextSelected as TableColumnKey[])}
                buttonText="Колонки"
            />
        </Flex>
    );
}

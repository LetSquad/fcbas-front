import { Checkbox, Dropdown } from "semantic-ui-react";
import { $enum } from "ts-enum-util";

import Flex from "@commonComponents/Flex";
import { getHeatMapLabelFromHeatmapModeEnum } from "@components/FlightsMap/utils";
import { HeatmapMode } from "@models/analytics/enums";

import GradientBar from "./GradientBar";
import styles from "./styles/LegendOverlay.module.scss";

interface LegendOverlayProps {
    heatmapMode: HeatmapMode;
    onChangeHeatmapMode: (mode: HeatmapMode) => void;
    heatCountDomain: { min: number; max: number };
    heatDurationDomain: { min: number; max: number };

    // для мини-градиента
    heatLowColor: string;
    heatHighColor: string;

    // переключатель видимости линий
    showFlows: boolean;
    topFlightsCount: number | undefined;
    onToggleShowFlows: (value: boolean) => void;
}

const HEATMAP_OPTIONS = $enum(HeatmapMode).map((value) => ({
    text: getHeatMapLabelFromHeatmapModeEnum(value),
    value
}));

export default function LegendOverlay({
    heatmapMode,
    onChangeHeatmapMode,
    heatCountDomain,
    heatDurationDomain,
    heatLowColor,
    heatHighColor,
    showFlows,
    topFlightsCount,
    onToggleShowFlows
}: LegendOverlayProps) {
    return (
        <Flex column rowGap="8px" className={styles.container}>
            <div className={styles.title}>Тепловая карта</div>

            <Dropdown
                className={styles.dropdown}
                selection
                options={HEATMAP_OPTIONS}
                value={heatmapMode}
                onChange={(_, { value }) => onChangeHeatmapMode(value as HeatmapMode)}
            />

            <GradientBar
                heatCountDomain={heatCountDomain}
                heatDurationDomain={heatDurationDomain}
                heatLowColor={heatLowColor}
                heatHighColor={heatHighColor}
                heatmapMode={heatmapMode}
            />

            {/* Переключатель линий */}
            <Flex alignItemsCenter gap="8px" className={styles.checkboxContainer}>
                <Checkbox checked={showFlows} onChange={(_, { checked }) => onToggleShowFlows(!!checked)} className={styles.checkbox} />
                <span>{`Отобразить перелёты между регионами ${topFlightsCount ? `(топ ${topFlightsCount})` : ""}`}</span>
            </Flex>
        </Flex>
    );
}

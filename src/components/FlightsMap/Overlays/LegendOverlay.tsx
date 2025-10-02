import { Checkbox, Dropdown } from "semantic-ui-react";
import { $enum } from "ts-enum-util";

import Flex from "@commonComponents/Flex";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getHeatMapLabelFromHeatmapModeEnum } from "@components/FlightsMap/utils";
import { HeatmapMode, TimeResolution } from "@models/analytics/enums";
import { HeatDomains } from "@models/analytics/types";

import GradientBar from "./GradientBar";
import styles from "./styles/LegendOverlay.module.scss";

interface LegendOverlayProps {
    heatmapMode: HeatmapMode;
    onChangeHeatmapMode: (mode: HeatmapMode) => void;
    heatDomains: HeatDomains;

    // для мини-градиента
    heatLowColor: string;
    heatHighColor: string;

    // переключатель видимости линий
    showFlows: boolean;
    topFlightsCount: number | undefined;
    onToggleShowFlows: (value: boolean) => void;
}

const HEATMAP_OPTIONS = (timeResolution: TimeResolution) =>
    $enum(HeatmapMode).map((value) => ({
        text: getHeatMapLabelFromHeatmapModeEnum(value, timeResolution),
        value
    }));

export default function LegendOverlay({
    heatmapMode,
    onChangeHeatmapMode,
    heatDomains,
    heatLowColor,
    heatHighColor,
    showFlows,
    topFlightsCount,
    onToggleShowFlows
}: LegendOverlayProps) {
    const formData = useFilterFormContext();

    return (
        <Flex column rowGap="8px" className={styles.container}>
            <div className={styles.title}>Тепловая карта</div>

            <Dropdown
                className={styles.dropdown}
                selection
                options={HEATMAP_OPTIONS(formData.resolution)}
                value={heatmapMode}
                onChange={(_, { value }) => onChangeHeatmapMode(value as HeatmapMode)}
                onWheel={(event: WheelEvent) => event.stopPropagation()}
            />

            <GradientBar heatDomains={heatDomains} heatLowColor={heatLowColor} heatHighColor={heatHighColor} heatmapMode={heatmapMode} />

            {/* Переключатель линий */}
            <Flex alignItemsCenter gap="8px" className={styles.checkboxContainer}>
                <Checkbox checked={showFlows} onChange={(_, { checked }) => onToggleShowFlows(!!checked)} className={styles.checkbox} />
                <span>{`Отобразить перелёты между регионами ${topFlightsCount ? `(топ ${topFlightsCount})` : ""}`}</span>
            </Flex>
        </Flex>
    );
}

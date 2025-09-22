import Flex from "@commonComponents/Flex";
import LegendOverlay from "@components/FlightsMap/Overlays/LegendOverlay";
import RegionOverlay from "@components/FlightsMap/Overlays/RegionOverlay";
import { HeatmapMode } from "@models/analytics/enums";

import styles from "./styles/Overlays.module.scss";

interface OverlaysProps {
    selectionActive: boolean;
    selectedRegionName?: string;
    selectedIntraCount?: number;
    selectedIntraAvgDurationSec?: number;

    heatmapMode: HeatmapMode;
    onChangeHeatmapMode: (mode: HeatmapMode) => void;
    heatCountDomain: { min: number; max: number };
    heatDurationDomain: { min: number; max: number };
    heatLowColor: string;
    heatHighColor: string;

    showFlows: boolean;
    topFlightsCount: number | undefined;
    onToggleShowFlows: (value: boolean) => void;
}

export default function Overlays({
    selectionActive,
    selectedRegionName,
    selectedIntraCount,
    selectedIntraAvgDurationSec,
    heatmapMode,
    onChangeHeatmapMode,
    heatCountDomain,
    heatDurationDomain,
    heatLowColor,
    heatHighColor,
    showFlows,
    topFlightsCount,
    onToggleShowFlows
}: OverlaysProps) {
    return (
        <Flex column rowGap="10px" className={styles.container}>
            <LegendOverlay
                heatmapMode={heatmapMode}
                onChangeHeatmapMode={onChangeHeatmapMode}
                heatCountDomain={heatCountDomain}
                heatDurationDomain={heatDurationDomain}
                heatLowColor={heatLowColor}
                heatHighColor={heatHighColor}
                showFlows={showFlows}
                topFlightsCount={topFlightsCount}
                onToggleShowFlows={onToggleShowFlows}
            />

            <RegionOverlay
                selectionActive={selectionActive}
                selectedRegionName={selectedRegionName}
                selectedIntraCount={selectedIntraCount}
                selectedIntraAvgDurationSec={selectedIntraAvgDurationSec}
            />
        </Flex>
    );
}

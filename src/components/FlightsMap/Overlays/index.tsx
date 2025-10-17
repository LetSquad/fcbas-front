import { useCallback, useEffect, useRef } from "react";

import Flex from "@commonComponents/Flex";
import LegendOverlay from "@components/FlightsMap/Overlays/LegendOverlay";
import RegionOverlay from "@components/FlightsMap/Overlays/RegionOverlay";
import { HeatmapMode } from "@models/analytics/enums";
import { HeatDomains, HeatMapInfo } from "@models/analytics/types";

import styles from "./styles/Overlays.module.scss";

interface OverlaysProps {
    selectionActive: boolean;
    selectedRegionName?: string;
    selectedRegionStat?: HeatMapInfo;
    interregionalFlightsCount?: number;

    heatmapMode: HeatmapMode;
    onChangeHeatmapMode: (mode: HeatmapMode) => void;
    heatDomains: HeatDomains;
    heatLowColor: string;
    heatHighColor: string;

    showFlows: boolean;
    topFlightsCount: number | undefined;
    onToggleShowFlows: (value: boolean) => void;
}

export default function Overlays({
    selectionActive,
    selectedRegionName,
    selectedRegionStat,
    interregionalFlightsCount,
    heatmapMode,
    onChangeHeatmapMode,
    heatDomains,
    heatLowColor,
    heatHighColor,
    showFlows,
    topFlightsCount,
    onToggleShowFlows
}: OverlaysProps) {
    const ref = useRef<HTMLDivElement>(null);

    const onWheel = useCallback((event: WheelEvent) => {
        event.stopPropagation();
    }, []);

    useEffect(() => {
        const element = ref?.current;

        if (!element) {
            return;
        }

        element.addEventListener("wheel", onWheel);

        return () => {
            element.removeEventListener("wheel", onWheel);
        };
    }, [onWheel, ref]);

    return (
        <Flex column rowGap="10px" className={styles.container} ref={ref}>
            <LegendOverlay
                heatmapMode={heatmapMode}
                onChangeHeatmapMode={onChangeHeatmapMode}
                heatDomains={heatDomains}
                heatLowColor={heatLowColor}
                heatHighColor={heatHighColor}
                showFlows={showFlows}
                topFlightsCount={topFlightsCount}
                onToggleShowFlows={onToggleShowFlows}
            />

            <RegionOverlay
                selectionActive={selectionActive}
                selectedRegionName={selectedRegionName}
                selectedRegionStat={selectedRegionStat}
                interregionalFlightsCount={interregionalFlightsCount}
            />
        </Flex>
    );
}

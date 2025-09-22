import Flex from "@commonComponents/Flex";
import { secToHM } from "@components/FlightsMap/utils";
import { HeatmapMode } from "@models/analytics/enums";

import styles from "./styles/GradientBar.module.scss";

interface GradientBarProps {
    heatLowColor: string;
    heatHighColor: string;
    heatmapMode: HeatmapMode;
    heatCountDomain: { min: number; max: number };
    heatDurationDomain: { min: number; max: number };
}

export default function GradientBar({ heatmapMode, heatHighColor, heatLowColor, heatDurationDomain, heatCountDomain }: GradientBarProps) {
    return (
        <Flex alignItemsCenter columnGap="5px">
            <div className={styles.dataContainer}>
                {heatmapMode === HeatmapMode.AVERAGE_DURATION ? (
                    <span>{secToHM(heatDurationDomain.min)}</span>
                ) : (
                    <span>{heatCountDomain.min}</span>
                )}
            </div>
            <div
                style={{
                    background: `linear-gradient(90deg, ${heatLowColor} 0%, ${heatHighColor} 100%)`
                }}
                className={styles.gradientBar}
            />
            <div className={styles.dataContainer}>
                {heatmapMode === HeatmapMode.AVERAGE_DURATION ? (
                    <span>{secToHM(heatDurationDomain.max)}</span>
                ) : (
                    <span>{heatCountDomain.max}</span>
                )}
            </div>
        </Flex>
    );
}

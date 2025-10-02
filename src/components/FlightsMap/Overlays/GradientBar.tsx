import { Duration } from "luxon";

import Flex from "@commonComponents/Flex";
import { HeatmapMode } from "@models/analytics/enums";
import { HeatDomains } from "@models/analytics/types";

import styles from "./styles/GradientBar.module.scss";

interface GradientBarProps {
    heatLowColor: string;
    heatHighColor: string;
    heatmapMode: HeatmapMode;
    heatDomains: HeatDomains;
}

export default function GradientBar({ heatmapMode, heatHighColor, heatLowColor, heatDomains }: GradientBarProps) {
    const data = heatDomains[heatmapMode];

    return (
        <Flex alignItemsCenter columnGap="5px">
            <div className={styles.dataContainer}>
                {heatmapMode === HeatmapMode.AVERAGE_DURATION ? (
                    <span>{Duration.fromObject({ seconds: data.min }).toFormat("hh:mm:ss")}</span>
                ) : (
                    <span>{data.min}</span>
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
                    <span>{Duration.fromObject({ seconds: data.max }).toFormat("hh:mm:ss")}</span>
                ) : (
                    <span>{data.max}</span>
                )}
            </div>
        </Flex>
    );
}

import { PropsWithChildren } from "react";

import styles from "./styles/MapTooltip.module.scss";

interface MapTooltipProps {
    visible: boolean;
    x: number;
    y: number;
}

/**
 * Обёртка для тултипа над SVG.
 */
export default function MapTooltip({ visible, x, y, children }: PropsWithChildren<MapTooltipProps>) {
    if (!visible) {
        return null;
    }

    return (
        <div
            className={styles.tooltip}
            style={{
                left: x,
                top: y
            }}
        >
            {children}
        </div>
    );
}

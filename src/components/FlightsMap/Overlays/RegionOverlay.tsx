import Flex from "@commonComponents/Flex";
import { secToHM } from "@components/FlightsMap/utils";

import styles from "./styles/RegionOverlay.module.scss";

interface RegionOverlayProps {
    selectionActive: boolean;
    selectedRegionName?: string;
    selectedIntraCount?: number;
    selectedIntraAvgDurationSec?: number;
}

export default function RegionOverlay({
    selectionActive,
    selectedRegionName,
    selectedIntraCount = 0,
    selectedIntraAvgDurationSec = 0
}: RegionOverlayProps) {
    return selectionActive ? (
        <Flex column rowGap="8px" className={styles.container}>
            {/* Информация о регионе — ниже легенды */}
            <div className={styles.title}>Статистика региона</div>
            <div className={styles.title}>{selectedRegionName}</div>

            <Flex column rowGap="6px">
                <div>{`Полётов внутри региона: ${selectedIntraCount}`}</div>

                <div>{`Средняя длительность: ${secToHM(selectedIntraAvgDurationSec)}`}</div>
            </Flex>
        </Flex>
    ) : null;
}

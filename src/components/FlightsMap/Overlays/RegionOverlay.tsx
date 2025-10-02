import { Duration } from "luxon";

import Flex from "@commonComponents/Flex";
import { HeatMapInfo } from "@models/analytics/types";

import styles from "./styles/RegionOverlay.module.scss";

interface RegionOverlayProps {
    selectionActive: boolean;
    selectedRegionName?: string;
    selectedRegionStat?: HeatMapInfo;
}

export default function RegionOverlay({ selectionActive, selectedRegionName, selectedRegionStat }: RegionOverlayProps) {
    return selectionActive ? (
        <Flex column rowGap="8px" className={styles.container}>
            {/* Информация о регионе — ниже легенды */}
            <div className={styles.title}>Статистика региона</div>
            <div className={styles.title}>{selectedRegionName}</div>

            <Flex column rowGap="6px">
                <div>{`Полётов внутри региона: ${selectedRegionStat?.averageFlightCount || 0}`}</div>

                <div>{`Среднее количество полетов: ${selectedRegionStat?.averageFlightCount || 0}`}</div>

                <div>{`Медианное количество полетов: ${selectedRegionStat?.medianFlightCount || 0}`}</div>

                <div>{`Максимально полетов: ${selectedRegionStat?.maxCount || 0}`}</div>

                <div>{`Средняя длительность: ${Duration.fromObject({ seconds: selectedRegionStat?.averageFlightDurationSeconds || 0 }).toFormat("hh:mm:ss")}`}</div>

                <div>{`Дней без полетов: ${selectedRegionStat?.emptyDays || 0}`}</div>

                <div>{`Интенсивность полетов: ${selectedRegionStat?.density || 0}`}</div>
            </Flex>
        </Flex>
    ) : null;
}

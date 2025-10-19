import { Duration } from "luxon";

import Flex from "@commonComponents/Flex";
import { HeatMapInfo } from "@models/analytics/types";

import styles from "./styles/RegionOverlay.module.scss";

interface RegionOverlayProps {
    selectionActive: boolean;
    selectedRegionName?: string;
    selectedRegionStat?: HeatMapInfo;
    interregionalFlightsCount?: number;
}

export default function RegionOverlay({
    selectionActive,
    selectedRegionName,
    selectedRegionStat,
    interregionalFlightsCount
}: RegionOverlayProps) {
    return selectionActive ? (
        <Flex column rowGap="8px" className={styles.container}>
            {/* Информация о регионе — ниже легенды */}
            <div className={styles.title}>Статистика региона</div>
            <div className={styles.title}>{selectedRegionName}</div>

            <Flex column rowGap="6px">
                <div>{`Полётов внутри региона: ${Math.max((selectedRegionStat?.flightCount || 0) - (interregionalFlightsCount || 0), 0)}`}</div>

                <div>{`Перелётов в другие регионы: ${interregionalFlightsCount ?? 0}`}</div>

                <div>{`Среднее количество: ${selectedRegionStat?.averageFlightCount || 0}`}</div>

                <div>{`Медианное количество: ${selectedRegionStat?.medianFlightCount || 0}`}</div>

                <div>{`Максимальное количество: ${selectedRegionStat?.maxCount || 0}`}</div>

                <div>{`Средняя длительность: ${Duration.fromObject({ seconds: selectedRegionStat?.averageFlightDurationSeconds || 0 }).toFormat("hh:mm:ss")}`}</div>

                <div>{`Дней без полетов: ${selectedRegionStat?.emptyDays || 0}`}</div>

                <div>{`Интенсивность: ${selectedRegionStat?.density ? Math.round(selectedRegionStat.density * 100) / 100 : 0}`}</div>
            </Flex>
        </Flex>
    ) : null;
}

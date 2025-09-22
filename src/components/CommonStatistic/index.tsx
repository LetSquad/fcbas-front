import Flex from "@commonComponents/Flex";
import Blocks from "@components/CommonStatistic/Blocks";
import FlightDensityDiagram from "@components/CommonStatistic/Charts/FlightDensityDiagram";
import TimeOfDayFlightsDiagram from "@components/CommonStatistic/Charts/TimeOfDayFlightsDiagram";
import TopAverageDurationFlightsDiagram from "@components/CommonStatistic/Charts/TopAverageDurationFlightsDiagram";
import TopFlightsDiagram from "@components/CommonStatistic/Charts/TopFlightsDiagram";
import TrendDiagram from "@components/CommonStatistic/Charts/TrendDiagram";

import styles from "./styles/CommonStatistic.module.scss";

export default function CommonStatistic() {
    return (
        <Flex height100 width100 gap="12px" wrap className={styles.container}>
            <Blocks />
            <TrendDiagram />
            <TopFlightsDiagram />
            <TimeOfDayFlightsDiagram />
            <TopAverageDurationFlightsDiagram />
            <FlightDensityDiagram />
        </Flex>
    );
}

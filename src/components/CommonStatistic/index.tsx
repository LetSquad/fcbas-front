import Flex from "@commonComponents/Flex";
import Blocks from "@components/CommonStatistic/Blocks";
import FlightDensityDiagram from "@components/CommonStatistic/Charts/FlightDensityDiagram";
import TimeOfDayFlightsDiagram from "@components/CommonStatistic/Charts/TimeOfDayFlightsDiagram";
import TopAverageDurationFlightsDiagram from "@components/CommonStatistic/Charts/TopAverageDurationFlightsDiagram";
import TopFlightsDiagram from "@components/CommonStatistic/Charts/TopFlightsDiagram";
import TopOperatorsFlightsDiagram from "@components/CommonStatistic/Charts/TopOperatorsFlightsDiagram";
import TrendDiagram from "@components/CommonStatistic/Charts/TrendDiagram";
import { useExtendedMode } from "@components/Dashboard/context";
import { OperatorType } from "@models/analytics/enums";

import styles from "./styles/CommonStatistic.module.scss";

export default function CommonStatistic() {
    const { isExtendedMode } = useExtendedMode();

    return (
        <Flex height100 width100 gap="12px" wrap className={styles.container}>
            {isExtendedMode && <Blocks />}
            <TrendDiagram />
            <TopFlightsDiagram />
            <TopOperatorsFlightsDiagram operatorType={OperatorType.UL} />
            {isExtendedMode && <TopOperatorsFlightsDiagram operatorType={OperatorType.FL} />}
            {isExtendedMode && <TimeOfDayFlightsDiagram />}
            <TopAverageDurationFlightsDiagram />
            {isExtendedMode && <FlightDensityDiagram />}
        </Flex>
    );
}

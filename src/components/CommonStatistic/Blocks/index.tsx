import Flex from "@commonComponents/Flex";
import AverageCountBlock from "@components/CommonStatistic/Blocks/AverageCountBlock";
import AverageDurationBlock from "@components/CommonStatistic/Blocks/AverageDurationBlock";
import CountBlock from "@components/CommonStatistic/Blocks/CountBlock";
import MaxCountBlock from "@components/CommonStatistic/Blocks/MaxCountBlock";
import MedianCountBlock from "@components/CommonStatistic/Blocks/MedianCountBlock";

import styles from "./styles/Blocks.module.scss";

export default function Blocks() {
    return (
        <Flex className={styles.container} width100 gap="8px" wrap>
            <CountBlock />
            <AverageDurationBlock />
            <AverageCountBlock />
            <MedianCountBlock />
            <MaxCountBlock />
        </Flex>
    );
}

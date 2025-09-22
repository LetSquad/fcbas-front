import { PropsWithChildren, useMemo } from "react";

import { Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";

import styles from "./styles/ChartWithLoading.module.scss";

interface ChartWithLoadingProps {
    title: string;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

export default function ChartWithLoading({ title, isLoading, isError, refetch, children }: PropsWithChildren<ChartWithLoadingProps>) {
    const content = useMemo(() => {
        if (isLoading) {
            return (
                <Flex height100 width100 justifyCenter alignItemsCenter>
                    <Loader active inline="centered" />
                </Flex>
            );
        }

        if (isError) {
            return <LoadingErrorBlock isLoadingErrorObjectText="информации для графика" reload={refetch} />;
        }

        return (
            <Flex height100 width100 column rowGap="8px">
                <span className={styles.title}>{title}</span>
                <div className={styles.chart}>{children}</div>
            </Flex>
        );
    }, [children, isError, isLoading, refetch, title]);

    return <div className={styles.block}>{content}</div>;
}

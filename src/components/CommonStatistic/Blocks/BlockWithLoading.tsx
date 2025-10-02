import { useMemo } from "react";

import { Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";

import styles from "./styles/BlockWithLoading.module.scss";

interface ChartWithLoadingProps {
    title: string;
    data: number | string | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

export default function BlockWithLoading({ title, data, isLoading, isError, refetch }: ChartWithLoadingProps) {
    const content = useMemo(() => {
        if (isLoading) {
            return (
                <Flex height100 width100 justifyCenter alignItemsCenter>
                    <Loader active inline="centered" />
                </Flex>
            );
        }

        if (isError) {
            return <LoadingErrorBlock isLoadingErrorObjectText="информации" reload={refetch} />;
        }

        return <span className={styles.value}>{data}</span>;
    }, [data, isError, isLoading, refetch]);

    return (
        <div className={styles.block}>
            <Flex height100 width100 column justifySpaceBetween rowGap="7px">
                <span className={styles.title}>{title}</span>
                {content}
            </Flex>
        </div>
    );
}

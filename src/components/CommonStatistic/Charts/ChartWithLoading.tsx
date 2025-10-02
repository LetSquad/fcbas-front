import { PropsWithChildren, useCallback, useMemo } from "react";

import classNames from "classnames";
import { saveAs } from "file-saver";
import { DateTime } from "luxon";
import { useGenerateImage } from "recharts-to-png";
import { Icon, Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { SortType } from "@models/analytics/enums";

import styles from "./styles/ChartWithLoading.module.scss";

interface ChartWithLoadingProps {
    title: string;
    isLoading: boolean;
    isError: boolean;
    isWide?: boolean;
    refetch: () => void;
    sort?: SortType;
    onSortChanged?: () => void;
}

export default function ChartWithLoading({
    title,
    isLoading,
    isError,
    refetch,
    isWide = false,
    sort,
    onSortChanged,
    children
}: PropsWithChildren<ChartWithLoadingProps>) {
    const [getDivPng, { ref, isLoading: isLoadingPng }] = useGenerateImage({
        quality: 1,
        type: "image/png"
    });

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

        return <div className={styles.chart}>{children}</div>;
    }, [children, isError, isLoading, refetch]);

    const handleDivDownload = useCallback(async () => {
        const png = await getDivPng();
        if (png) {
            saveAs(png, `report-${DateTime.now().toFormat("dd.MM.yyyy")}.png`);
        }
    }, [getDivPng]);

    return (
        <div className={classNames({ [styles.block]: !isWide, [styles.blockWide]: isWide })} ref={ref}>
            <Flex height100 width100 column rowGap="8px">
                <Flex rowGap="15px" justifySpaceBetween alignItemsCenter>
                    <span className={styles.title}>{title}</span>
                    <Flex rowGap="5px" alignItemsCenter>
                        <Icon link onClick={handleDivDownload} name="download" loading={isLoadingPng} />
                        {sort && onSortChanged && (
                            <Icon link onClick={onSortChanged} name={sort === SortType.DESC ? "sort amount down" : "sort amount up"} />
                        )}
                    </Flex>
                </Flex>

                {content}
            </Flex>
        </div>
    );
}

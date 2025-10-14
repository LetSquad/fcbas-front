import { PropsWithChildren, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

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
    isDownloadDisabled?: boolean;
}

export default function ChartWithLoading({
    title,
    isLoading,
    isError,
    refetch,
    isWide = false,
    sort,
    onSortChanged,
    isDownloadDisabled,
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
        if (isLoadingPng) {
            return;
        }

        try {
            toast.dismiss("download-png-error");

            const png = await getDivPng();

            if (!png) {
                toast.error("Не удалось подготовить изображение. Пожалуйста, попробуйте ещё раз позже.", {
                    id: "download-png-error",
                    duration: 10_000
                });

                return;
            }

            saveAs(png, `report-${DateTime.now().toFormat("dd.MM.yyyy")}.png`);
        } catch (error) {
            console.error("Не удалось скачать график", error);

            toast.error("При скачивании произошла ошибка. Попробуйте обновить страницу или повторить попытку позже.", {
                id: "download-png-error",
                duration: 10_000
            });
        }
    }, [getDivPng, isLoadingPng]);

    return (
        <div className={classNames({ [styles.block]: !isWide, [styles.blockWide]: isWide })} ref={ref}>
            <Flex height100 width100 column rowGap="8px">
                <Flex rowGap="15px" justifySpaceBetween alignItemsCenter>
                    <span className={styles.title}>{title}</span>
                    {(!isDownloadDisabled || (sort && onSortChanged)) && (
                        <Flex rowGap="5px" alignItemsCenter>
                            {!isDownloadDisabled && (
                                <Icon
                                    link={!isLoadingPng}
                                    onClick={handleDivDownload}
                                    name="download"
                                    loading={isLoadingPng}
                                    aria-disabled={isLoadingPng}
                                    disabled={isLoadingPng}
                                />
                            )}
                            {sort && onSortChanged && (
                                <Icon link onClick={onSortChanged} name={sort === SortType.DESC ? "sort amount down" : "sort amount up"} />
                            )}
                        </Flex>
                    )}
                </Flex>

                {content}
            </Flex>
        </div>
    );
}

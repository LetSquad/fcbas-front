import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import { FormikProvider, useFormik } from "formik";
import { Checkbox, Loader, Tab, TabPane, TabProps } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useExtendedMode, useMapFullscreen } from "@components/App/context";
import CommonStatistic from "@components/CommonStatistic";
import { FilterFormContext } from "@components/Dashboard/context";
import Filters, { INITIAL_FORM_DATA } from "@components/Dashboard/Filters";
import FlightsMapWrapper from "@components/FlightsMap/FlightsMapWrapper";
import StatisticTable from "@components/StatisticTable";
import { FormData } from "@models/filters/types";
import { useGetRegionsQuery } from "@store/regions/api";

import styles from "./styles/Dashboard.module.scss";

export default function Dashboard() {
    const { data: regions, isLoading: isRegionsLoading, isError: isRegionsError, refetch: refetchRegions } = useGetRegionsQuery();

    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA());
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const { isMapFullscreen, setMapFullscreen } = useMapFullscreen();
    const { isExtendedMode, setIsExtendedMode } = useExtendedMode();

    const formik = useFormik<FormData>({
        onSubmit: setFormData,
        initialValues: formData
    });

    const withRegionsLoader = useCallback(
        (child: ReactNode) => {
            if (isRegionsLoading) {
                return (
                    <Flex alignContentCenter alignItemsCenter height100 width100>
                        <Loader active inline="centered" />
                    </Flex>
                );
            }

            if (isRegionsError) {
                return <LoadingErrorBlock isLoadingErrorObjectText="регионов" reload={refetchRegions} />;
            }

            return child;
        },
        [isRegionsError, isRegionsLoading, refetchRegions]
    );

    const handleToggleMapFullscreen = useCallback(() => {
        setMapFullscreen((prev) => !prev);
    }, [setMapFullscreen]);

    const panes = useMemo(() => {
        const basePanes = [
            {
                menuItem: "Карта",
                render: () => (
                    <TabPane className={classNames(styles.tab, { [styles.tabFullscreen]: isMapFullscreen })}>
                        {withRegionsLoader(
                            <FlightsMapWrapper
                                regions={regions ?? {}}
                                isFullscreen={isMapFullscreen}
                                onToggleFullscreen={handleToggleMapFullscreen}
                            />
                        )}
                    </TabPane>
                )
            },
            {
                menuItem: "Дашборд",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<CommonStatistic />)}</TabPane>
            }
        ];

        if (isExtendedMode) {
            basePanes.push({
                menuItem: "Таблица",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<StatisticTable />)}</TabPane>
            });
        }

        return basePanes;
    }, [handleToggleMapFullscreen, isExtendedMode, isMapFullscreen, regions, withRegionsLoader]);

    const handleExtendedModeChange = useCallback(
        (_: unknown, data: { checked?: boolean }) => {
            setIsExtendedMode(Boolean(data.checked));
        },
        [setIsExtendedMode]
    );

    const handleTabChange = useCallback(
        (_: unknown, data: TabProps) => {
            const rawActiveIndex = data.activeIndex;
            const nextActiveIndex = typeof rawActiveIndex === "number" ? rawActiveIndex : Number(rawActiveIndex ?? activeTabIndex);

            setActiveTabIndex(Number.isNaN(nextActiveIndex) ? 0 : nextActiveIndex);
        },
        [activeTabIndex]
    );

    useEffect(() => {
        if (!isExtendedMode && activeTabIndex > 1) {
            setActiveTabIndex(0);
        }
    }, [activeTabIndex, isExtendedMode]);

    useEffect(
        () => () => {
            setMapFullscreen(false);
        },
        [setMapFullscreen]
    );

    return (
        <FilterFormContext.Provider value={formData}>
            <Flex column width100 height100 className={classNames({ [styles.fullscreenLayout]: isMapFullscreen })}>
                <FormikProvider value={formik}>{!isMapFullscreen && <Filters />}</FormikProvider>
                <div className={styles.tabWrapper}>
                    <Tab
                        className={classNames(styles.container, { [styles.containerFullscreen]: isMapFullscreen })}
                        menu={isMapFullscreen ? { style: { display: "none" } } : undefined}
                        activeIndex={activeTabIndex}
                        onTabChange={handleTabChange}
                        panes={panes}
                    />
                    {!isMapFullscreen && (
                        <div className={styles.modeToggle}>
                            <Checkbox toggle label="Расширенный режим" checked={isExtendedMode} onChange={handleExtendedModeChange} />
                        </div>
                    )}
                </div>
            </Flex>
        </FilterFormContext.Provider>
    );
}

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import { FormikProvider, useFormik } from "formik";
import { Loader, Tab, TabPane } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useMapFullscreen } from "@components/App/context";
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
    const { isMapFullscreen, setMapFullscreen } = useMapFullscreen();

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

    const panes = useMemo(
        () => [
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
            },
            {
                menuItem: "Таблица",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<StatisticTable />)}</TabPane>
            }
        ],
        [handleToggleMapFullscreen, isMapFullscreen, regions, withRegionsLoader]
    );

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
                <Tab
                    className={classNames(styles.container, { [styles.containerFullscreen]: isMapFullscreen })}
                    menu={isMapFullscreen ? { style: { display: "none" } } : undefined}
                    panes={panes}
                />
            </Flex>
        </FilterFormContext.Provider>
    );
}

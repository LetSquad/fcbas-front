import { ReactNode, useCallback, useMemo, useState } from "react";

import { FormikProvider, useFormik } from "formik";
import { Loader, Tab, TabPane } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
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

    const panes = useMemo(
        () => [
            {
                menuItem: "Карта",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<FlightsMapWrapper regions={regions ?? {}} />)}</TabPane>
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
        [regions, withRegionsLoader]
    );

    return (
        <FilterFormContext.Provider value={formData}>
            <Flex column width100 height100>
                <FormikProvider value={formik}>
                    <Filters />
                </FormikProvider>
                <Tab className={styles.container} panes={panes} />
            </Flex>
        </FilterFormContext.Provider>
    );
}

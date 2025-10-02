import { ReactNode, useCallback, useMemo, useState } from "react";

import { FormikProvider, useFormik } from "formik";
import { DateTime } from "luxon";
import { Loader, Tab, TabPane } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import CommonStatistic from "@components/CommonStatistic";
import { FilterFormContext } from "@components/Dashboard/context";
import Filters from "@components/Dashboard/Filters";
import FlightsMapWrapper from "@components/FlightsMap/FlightsMapWrapper";
import { TimeResolution } from "@models/analytics/enums";
import { FormData } from "@models/filters/types";
import { Region } from "@models/regions/types";
import { useGetRegionsQuery } from "@store/regions/api";

import styles from "./styles/Dashboard.module.scss";

export default function Dashboard() {
    const { data: regions, isLoading: isRegionsLoading, isError: isRegionsError, refetch: refetchRegions } = useGetRegionsQuery();

    const [formData, setFormData] = useState<FormData>({
        startDate: DateTime.now().startOf("year").toISODate(),
        finishDate: DateTime.now().toISODate(),
        resolution: TimeResolution.MONTH
    });

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
                render: () => (
                    <TabPane className={styles.tab}>{withRegionsLoader(<FlightsMapWrapper regions={regions as Region[]} />)}</TabPane>
                )
            },
            {
                menuItem: "Общая статистика",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<CommonStatistic />)}</TabPane>
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

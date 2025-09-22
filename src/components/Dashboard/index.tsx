import { ReactNode, useCallback, useMemo } from "react";

import { Loader, Tab, TabPane } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import CommonStatistic from "@components/CommonStatistic";
import FlightsMapWrapper from "@components/FlightsMap/FlightsMapWrapper";
import { Region } from "@models/regions/types";
import { useGetRegionsQuery } from "@store/regions/api";

import styles from "./styles/Dashboard.module.scss";

export default function Dashboard() {
    const { data: regions, isLoading: isRegionsLoading, isError: isRegionsError, refetch: refetchRegions } = useGetRegionsQuery();

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
                    <TabPane className={styles.tab}>
                        {withRegionsLoader(
                            <FlightsMapWrapper
                                regions={regions as Region[]}
                                onRegionClick={(regionId) => console.log("region", regionId)}
                            />
                        )}
                    </TabPane>
                )
            },
            {
                menuItem: "Общая статистика",
                render: () => <TabPane className={styles.tab}>{withRegionsLoader(<CommonStatistic />)}</TabPane>
            }
        ],
        [regions, withRegionsLoader]
    );

    return <Tab className={styles.container} panes={panes} />;
}

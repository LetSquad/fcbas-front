import { useMemo } from "react";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import chartStyles from "@components/CommonStatistic/Charts/styles/Chart.module.scss";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { useGetDensityByRegionQuery } from "@store/analytics/api";
import { useGetRegionsQuery } from "@store/regions/api";

import styles from "./styles/FlightDensityDiagram.module.scss";

export default function FlightDensityDiagram() {
    const formData = useFilterFormContext();

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isFetching: isDensityByRegionsFetching,
        isError: isDensityByRegionsError,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery(formData);

    const { data: regions } = useGetRegionsQuery();

    const flightDensityDataset = useMemo(() => {
        if (!densityByRegions) {
            return undefined;
        }

        const topRegionsArray = Object.entries(densityByRegions.regionsMap)
            .toSorted((a, b) => b[1] - a[1])
            .slice(0, 10);

        return topRegionsArray.map(([regionId, flightsCount]) => ({
            name: regions?.[Number(regionId)]?.name || regionId,
            size: Math.round(flightsCount * 100) / 100
        }));
    }, [densityByRegions, regions]);

    return (
        <ChartWithLoading
            title={`Топ 10 регионов по интенсивности полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}${densityByRegions?.partAreaKm ? ` (на ${densityByRegions.partAreaKm} км²)` : ""}`}
            isLoading={isDensityByRegionsLoading || isDensityByRegionsFetching}
            isError={isDensityByRegionsError}
            refetch={refetchDensityByRegions}
        >
            <ResponsiveContainer width="100%" height="100%" className={styles.container}>
                <Treemap data={flightDensityDataset} className={chartStyles.chart} dataKey="size" aspectRatio={4 / 3}>
                    <Tooltip />
                </Treemap>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

import { useMemo } from "react";
import { useSelector } from "react-redux";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import chartStyles from "@components/CommonStatistic/Charts/styles/Chart.module.scss";
import { useFilterForm } from "@components/Dashboard/context";
import { useGetDensityByRegionQuery } from "@store/analytics/api";
import { regionsApi } from "@store/regions/api";

import styles from "./styles/FlightDensityDiagram.module.scss";

export default function FlightDensityDiagram() {
    const formData = useFilterForm();

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isFetching: isDensityByRegionsFetching,
        isError: isDensityByRegionsError,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const { data: regions } = useSelector(regionsApi.endpoints.getRegions.select());

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
            title={`Топ 10 регионов по интенсивности полетов${densityByRegions?.partAreaKm ? ` (на ${densityByRegions.partAreaKm} км²)` : ""}`}
            isLoading={isDensityByRegionsLoading || isDensityByRegionsFetching}
            isError={isDensityByRegionsError}
            refetch={refetchDensityByRegions}
            isWide
        >
            <ResponsiveContainer width="100%" height="100%" className={styles.container}>
                <Treemap data={flightDensityDataset} className={chartStyles.chart} dataKey="size" aspectRatio={4 / 3}>
                    <Tooltip />
                </Treemap>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

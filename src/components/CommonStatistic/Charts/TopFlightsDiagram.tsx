import { useMemo } from "react";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { useGetCountByRegionQuery } from "@store/analytics/api";
import { useGetRegionsQuery } from "@store/regions/api";

import chartStyles from "./styles/Chart.module.scss";

export default function TopFlightsDiagram() {
    const formData = useFilterFormContext();

    const {
        data: countByRegions,
        isLoading: isCountByRegionsLoading,
        isFetching: isCountByRegionsFetching,
        isError: isCountByRegionsError,
        refetch: refetchCountByRegions
    } = useGetCountByRegionQuery({ startDate: formData.startDate, endDate: formData.endDate });

    const { data: regions } = useGetRegionsQuery();

    const topFlightsDataset = useMemo(() => {
        if (!countByRegions) {
            return undefined;
        }

        return Object.entries(countByRegions.regionsMap)
            ?.map(([regionId, flightsCount]) => ({
                name: regions?.[Number(regionId)]?.name || regionId,
                value: flightsCount
            }))
            .toSorted((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [countByRegions, regions]);

    return (
        <ChartWithLoading
            title="Топ 10 регионов по числу полетов"
            isLoading={isCountByRegionsLoading || isCountByRegionsFetching}
            isError={isCountByRegionsError}
            refetch={refetchCountByRegions}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFlightsDataset} className={chartStyles.chart} layout="vertical">
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis type="number" padding={{ right: 30 }} />
                    <YAxis dataKey="name" type="category" width={180} />
                    <Tooltip />
                    <Bar dataKey="value" name="Полетов" fill="#3373bc" label={{ position: "right" }} />
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

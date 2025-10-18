import { useMemo } from "react";
import { useSelector } from "react-redux";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useGetFlightsBetweenRegionQuery } from "@store/analytics/api";
import { regionsApi } from "@store/regions/api";

import chartStyles from "./styles/Chart.module.scss";
import styles from "./styles/TopDirectionsFlightsDiagram.module.scss";

interface TopDirectionsDatasetItem {
    name: string;
    value: number;
}
export default function TopDirectionsFlightsDiagram() {
    const { data: flightsBetweenRegions, isLoading, isFetching, isError, refetch } = useGetFlightsBetweenRegionQuery();
    const { data: regions } = useSelector(regionsApi.endpoints.getRegions.select());

    const topDirectionsDataset = useMemo<TopDirectionsDatasetItem[]>(() => {
        if (!flightsBetweenRegions?.topFly) {
            return [];
        }

        return flightsBetweenRegions.topFly.slice(0, 10).map((flight) => {
            const departureName = regions?.[flight.departureRegionId]?.name ?? `Регион ${flight.departureRegionId}`;
            const destinationName = regions?.[flight.destinationRegionId]?.name ?? `Регион ${flight.destinationRegionId}`;

            return {
                name: `${departureName} → ${destinationName}`,
                value: flight.count
            };
        });
    }, [flightsBetweenRegions, regions]);

    return (
        <ChartWithLoading
            title="Топ 10 направлений между регионами по числу полетов"
            isLoading={isLoading || isFetching}
            isError={isError}
            refetch={refetch}
            isWide
        >
            <ResponsiveContainer width="100%" height="100%" className={styles.container}>
                <BarChart data={topDirectionsDataset} className={chartStyles.chart} layout="vertical">
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis type="number" padding={{ right: 30 }} />
                    <YAxis dataKey="name" type="category" width={380} />
                    <Tooltip />
                    <Bar dataKey="value" name="Полетов" fill="#3373bc" label={{ position: "right" }} />
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

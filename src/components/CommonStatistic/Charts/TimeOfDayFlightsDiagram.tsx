import { useMemo } from "react";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { useGetTimeDistributionQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";

const COLORS = ["#FFBB28", "#00C49F", "#0088FE"];

export default function TimeOfDayFlightsDiagram() {
    const formData = useFilterFormContext();

    const {
        data: timeDistributions,
        isLoading: isTimeDistributionsLoading,
        isFetching: isTimeDistributionsFetching,
        isError: isTimeDistributionsError,
        refetch: refetchTimeDistributions
    } = useGetTimeDistributionQuery({ startDate: formData.startDate, endDate: formData.endDate });

    const timeOfDayFlightsDataset = useMemo(
        () => [
            {
                name: "Утро",
                value: timeDistributions?.morningFlightsCount
            },
            {
                name: "День",
                value: timeDistributions?.dayMiddleFlightsCount
            },
            {
                name: "Вечер",
                value: timeDistributions?.eveningFlightsCount
            }
        ],
        [timeDistributions]
    );

    return (
        <ChartWithLoading
            title="Распределение полетов внутри дня"
            isLoading={isTimeDistributionsLoading || isTimeDistributionsFetching}
            isError={isTimeDistributionsError}
            refetch={refetchTimeDistributions}
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart className={chartStyles.chart}>
                    <Pie data={timeOfDayFlightsDataset} dataKey="value" label startAngle={90} endAngle={-270}>
                        {timeOfDayFlightsDataset.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <Legend />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

import { useMemo } from "react";

import { Cell, Legend, Pie, PieChart, PieLabelRenderProps, ResponsiveContainer } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useGetTimeDistributionQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";

const COLORS = ["#FFBB28", "#00C49F", "#0088FE"];
const RADIAN = Math.PI / 167;

export default function TimeOfDayFlightsDiagram() {
    const {
        data: timeDistributions,
        isLoading: isTimeDistributionsLoading,
        isError: isTimeDistributionsError,
        refetch: refetchTimeDistributions
    } = useGetTimeDistributionQuery(undefined);

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

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: PieLabelRenderProps) => {
        const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.7;
        const x = Number(cx) + radius * Math.cos(-(Number(midAngle) ?? 0) * RADIAN);
        const y = Number(cy) + radius * Math.sin(-(Number(midAngle) ?? 0) * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > Number(cx) ? "start" : "end"} dominantBaseline="central">
                {value as string}
            </text>
        );
    };

    return (
        <ChartWithLoading
            title="Распределение полетов внутри дня"
            isLoading={isTimeDistributionsLoading}
            isError={isTimeDistributionsError}
            refetch={refetchTimeDistributions}
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart className={chartStyles.chart}>
                    <Pie
                        data={timeOfDayFlightsDataset}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        startAngle={90}
                        endAngle={-270}
                    >
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

import { useCallback, useMemo } from "react";

import { DateTime } from "luxon";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Props } from "recharts/types/component/Label";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useGetTrendQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";

export default function TrendDiagram() {
    const { data: trend, isLoading: isTrendLoading, isError: isTrendError, refetch: refetchTrend } = useGetTrendQuery(undefined);

    const trendDataset = useMemo(
        () =>
            trend?.periods?.map((period) => ({
                name: DateTime.fromISO(period.date).toFormat("MM.yy", { locale: "ru" }),
                value: period.flightsCount,
                percentage: period.percentageChange
            })),
        [trend?.periods]
    );

    const renderCustomizedLabel = useCallback((props: Props) => {
        const { x, y, width, value } = props;
        const radius = 10;
        const percentage = Math.round(Number(value));

        return (
            <g>
                <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - radius}
                    fill={percentage > 0 ? "#21ba0b" : "#bd1010"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {`${Math.abs(percentage)}%`}
                </text>
            </g>
        );
    }, []);

    return (
        <ChartWithLoading title="Динамика полетов по месяцам" isLoading={isTrendLoading} isError={isTrendError} refetch={refetchTrend}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendDataset} className={chartStyles.chart}>
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis dataKey="name" />
                    <YAxis padding={{ top: 20 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Полетов" fill="#3373bc">
                        <LabelList dataKey="percentage" content={renderCustomizedLabel} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

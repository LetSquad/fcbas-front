import { useCallback, useMemo } from "react";

import { DateTime } from "luxon";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Props } from "recharts/types/component/Label";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { TimeResolution } from "@models/analytics/enums";
import { useGetTrendQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";
import styles from "./styles/TrendDiagram.module.scss";

export default function TrendDiagram() {
    const formData = useFilterFormContext();

    const {
        data: trend,
        isLoading: isTrendLoading,
        isFetching: isTrendFetching,
        isError: isTrendError,
        refetch: refetchTrend
    } = useGetTrendQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

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

        if (percentage === 0) {
            return null;
        }

        return (
            <g>
                <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - radius}
                    fill={percentage > 0 ? "#21ba0b" : "#bd1010"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {`${percentage > 0 ? "▲" : "▼"}${Math.abs(percentage)}%`}
                </text>
            </g>
        );
    }, []);

    const isMonth = formData.resolution === TimeResolution.MONTH;

    return (
        <ChartWithLoading
            title="Динамика полетов (по месяцам)"
            isLoading={isTrendLoading || isTrendFetching}
            isError={isTrendError}
            refetch={refetchTrend}
            isDownloadDisabled={!isMonth}
        >
            {!isMonth && (
                <span className={styles.placeholder}>
                    Выбран более детальный промежуток измерения. Выберите &#34;Месяц&#34;, чтобы построить график
                </span>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isMonth ? trendDataset : []} className={chartStyles.chart}>
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis dataKey="name" />
                    <YAxis padding={{ top: 20 }} />
                    {isMonth && <Tooltip />}
                    {isMonth && (
                        <Bar dataKey="value" name="Полетов" fill="#3373bc">
                            <LabelList dataKey="percentage" content={renderCustomizedLabel} />
                        </Bar>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

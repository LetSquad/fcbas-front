import { useCallback, useMemo } from "react";

import { Duration } from "luxon";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Props } from "recharts/types/component/Label";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { useGetAverageDurationByRegionQuery } from "@store/analytics/api";
import { useGetRegionsQuery } from "@store/regions/api";

import chartStyles from "./styles/Chart.module.scss";

export default function TopAverageDurationFlightsDiagram() {
    const formData = useFilterFormContext();

    const {
        data: averageDurationByRegions,
        isLoading: isAverageDurationByRegionsLoading,
        isFetching: isAverageDurationByRegionsFetching,
        isError: isAverageDurationByRegionsError,
        refetch: refetchAverageDurationByRegions
    } = useGetAverageDurationByRegionQuery({ startDate: formData.startDate, endDate: formData.endDate });

    const { data: regions } = useGetRegionsQuery();

    const topFlightsDataset = useMemo(() => {
        if (!averageDurationByRegions) {
            return undefined;
        }

        return Object.entries(averageDurationByRegions.regionsMap)
            ?.map(([regionId, averageFlightDurationSeconds]) => ({
                name: regions?.[Number(regionId)]?.name || regionId,
                value: averageFlightDurationSeconds
            }))
            .toSorted((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [averageDurationByRegions, regions]);

    const renderCustomizedLabel = useCallback((props: Props) => {
        const { x, y, width, value } = props;
        const yRadius = 10;
        const xRadius = 30;

        return (
            <g>
                <text
                    x={Number(x) + Number(width) + xRadius}
                    y={Number(y) + yRadius}
                    fill="#808080"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {Duration.fromObject({ seconds: Number(value) }).toFormat("hh:mm:ss")}
                </text>
            </g>
        );
    }, []);

    return (
        <ChartWithLoading
            title="Топ 10 регионов по средней длительности полета"
            isLoading={isAverageDurationByRegionsLoading || isAverageDurationByRegionsFetching}
            isError={isAverageDurationByRegionsError}
            refetch={refetchAverageDurationByRegions}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFlightsDataset} className={chartStyles.chart} layout="vertical">
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis
                        type="number"
                        padding={{ right: 35 }}
                        tickFormatter={(value) => Duration.fromObject({ seconds: value }).toFormat("hh:mm:ss")}
                    />
                    <YAxis dataKey="name" type="category" width={180} />
                    <Tooltip formatter={(value) => Duration.fromObject({ seconds: value as number }).toFormat("hh:mm:ss")} />
                    <Bar dataKey="value" name="Средняя длительность" fill="#3373bc" label={renderCustomizedLabel} />
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

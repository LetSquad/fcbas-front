import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { SortType } from "@models/analytics/enums";
import { useGetCountByRegionQuery } from "@store/analytics/api";
import { regionsApi } from "@store/regions/api";

import chartStyles from "./styles/Chart.module.scss";

export default function TopFlightsDiagram() {
    const formData = useFilterFormContext();
    const [sort, setSort] = useState<SortType>(SortType.DESC);

    const {
        data: countByRegions,
        isLoading: isCountByRegionsLoading,
        isFetching: isCountByRegionsFetching,
        isError: isCountByRegionsError,
        refetch: refetchCountByRegions
    } = useGetCountByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const { data: regions } = useSelector(regionsApi.endpoints.getRegions.select());

    const topFlightsDataset = useMemo(() => {
        if (!countByRegions) {
            return undefined;
        }

        return Object.entries(countByRegions.regionsMap)
            ?.map(([regionId, flightsCount]) => ({
                name: regions?.[Number(regionId)]?.name || regionId,
                value: flightsCount
            }))
            .toSorted((a, b) => (sort === SortType.DESC ? b.value - a.value : a.value - b.value))
            .slice(0, 10);
    }, [countByRegions, regions, sort]);

    const onSortChanged = () => {
        setSort((prevSort) => (prevSort === SortType.DESC ? SortType.ASC : SortType.DESC));
    };

    return (
        <ChartWithLoading
            title="Топ 10 регионов по числу полетов"
            isLoading={isCountByRegionsLoading || isCountByRegionsFetching}
            isError={isCountByRegionsError}
            refetch={refetchCountByRegions}
            sort={sort}
            onSortChanged={onSortChanged}
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

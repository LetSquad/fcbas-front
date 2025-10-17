import { useMemo, useState } from "react";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterForm } from "@components/Dashboard/context";
import { SortType } from "@models/analytics/enums";
import { useGetFlightsCountByOperatorQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";

export default function TopOperatorsFlightsDiagram() {
    const formData = useFilterForm();
    const [sort, setSort] = useState<SortType>(SortType.DESC);

    const {
        data: countByOperators,
        isLoading: isCountByOperatorsLoading,
        isFetching: isCountByOperatorsFetching,
        isError: isCountByOperatorsError,
        refetch: refetchCountByOperators
    } = useGetFlightsCountByOperatorQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const topFlightsDataset = useMemo(() => {
        if (!countByOperators) {
            return undefined;
        }

        return Object.entries(countByOperators.operatorsMap)
            .map(([operatorName, flightsCount]) => ({
                name: operatorName,
                value: flightsCount
            }))
            .toSorted((a, b) => (sort === SortType.DESC ? b.value - a.value : a.value - b.value))
            .slice(0, 10);
    }, [countByOperators, sort]);

    const onSortChanged = () => {
        setSort((prevSort) => (prevSort === SortType.DESC ? SortType.ASC : SortType.DESC));
    };

    return (
        <ChartWithLoading
            title="Топ 10 операторов по числу полетов"
            isLoading={isCountByOperatorsLoading || isCountByOperatorsFetching}
            isError={isCountByOperatorsError}
            refetch={refetchCountByOperators}
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

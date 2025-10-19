import { useMemo } from "react";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartWithLoading from "@components/CommonStatistic/Charts/ChartWithLoading";
import { useFilterForm } from "@components/Dashboard/context";
import { OperatorType } from "@models/analytics/enums";
import { useGetFlightsCountByOperatorQuery } from "@store/analytics/api";

import chartStyles from "./styles/Chart.module.scss";

interface TopOperatorsFlightsDataset {
    operatorType: OperatorType;
}

export default function TopOperatorsFlightsDiagram({ operatorType }: TopOperatorsFlightsDataset) {
    const formData = useFilterForm();

    const {
        data: countByOperators,
        isLoading: isCountByOperatorsLoading,
        isFetching: isCountByOperatorsFetching,
        isError: isCountByOperatorsError,
        refetch: refetchCountByOperators
    } = useGetFlightsCountByOperatorQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const topOperatorsDataset = useMemo(
        () =>
            countByOperators
                ? Object.entries(countByOperators.operatorsMap[operatorType] ?? {})
                      .map(([operatorName, flightsCount]) => ({
                          name: operatorName,
                          value: flightsCount
                      }))
                      .slice(0, 10)
                : [],
        [countByOperators, operatorType]
    );

    return (
        <ChartWithLoading
            title={`Топ 10 операторов ${operatorType === OperatorType.UL ? "юрлиц" : "физлиц"} по числу полетов`}
            isLoading={isCountByOperatorsLoading || isCountByOperatorsFetching}
            isError={isCountByOperatorsError}
            refetch={refetchCountByOperators}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOperatorsDataset} className={chartStyles.chart} layout="vertical">
                    <CartesianGrid strokeDasharray="2 5" />
                    <XAxis type="number" padding={{ right: 30 }} />
                    <YAxis dataKey="name" type="category" width={operatorType === OperatorType.UL ? 180 : 260} />
                    <Tooltip />
                    <Bar dataKey="value" name="Полетов" fill="#3373bc" label={{ position: "right" }} />
                </BarChart>
            </ResponsiveContainer>
        </ChartWithLoading>
    );
}

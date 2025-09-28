import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useGetAverageCountQuery } from "@store/analytics/api";

export default function AverageCountBlock() {
    const {
        data: averageCount,
        isLoading: isAverageCountLoading,
        isError: isAverageCountError,
        refetch: refetchAverageCount
    } = useGetAverageCountQuery(undefined);

    return (
        <BlockWithLoading
            title="Среднее количество полетов"
            data={averageCount?.averageFlightsCount}
            isLoading={isAverageCountLoading}
            isError={isAverageCountError}
            refetch={refetchAverageCount}
        />
    );
}

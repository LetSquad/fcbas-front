import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useGetAverageCountQuery } from "@store/analytics/api";

export default function MedianCountBlock() {
    const {
        data: averageCount,
        isLoading: isAverageCountLoading,
        isError: isAverageCountError,
        refetch: refetchAverageCount
    } = useGetAverageCountQuery(undefined);

    return (
        <BlockWithLoading
            title="Медианное количество полета"
            data={averageCount?.medianFlightsCount}
            isLoading={isAverageCountLoading}
            isError={isAverageCountError}
            refetch={refetchAverageCount}
        />
    );
}

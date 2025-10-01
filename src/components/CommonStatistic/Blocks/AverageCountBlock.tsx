import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { useGetAverageCountQuery } from "@store/analytics/api";

export default function AverageCountBlock() {
    const formData = useFilterFormContext();

    const {
        data: averageCount,
        isLoading: isAverageCountLoading,
        isFetching: isAverageCountFetching,
        isError: isAverageCountError,
        refetch: refetchAverageCount
    } = useGetAverageCountQuery(formData);

    return (
        <BlockWithLoading
            title={`Среднее количество полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
            data={averageCount?.averageFlightsCount}
            isLoading={isAverageCountLoading || isAverageCountFetching}
            isError={isAverageCountError}
            refetch={refetchAverageCount}
        />
    );
}

import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useFilterForm } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { useGetAverageCountQuery } from "@store/analytics/api";

export default function MedianCountBlock() {
    const formData = useFilterForm();

    const {
        data: averageCount,
        isLoading: isAverageCountLoading,
        isFetching: isAverageCountFetching,
        isError: isAverageCountError,
        refetch: refetchAverageCount
    } = useGetAverageCountQuery(formData);

    return (
        <BlockWithLoading
            title={`Медианное количество полета ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
            data={averageCount?.medianFlightsCount}
            isLoading={isAverageCountLoading || isAverageCountFetching}
            isError={isAverageCountError}
            refetch={refetchAverageCount}
        />
    );
}

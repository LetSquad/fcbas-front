import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { useGetMaxCountQuery } from "@store/analytics/api";

export default function MaxCountBlock() {
    const formData = useFilterFormContext();

    const {
        data: maxCount,
        isLoading: isMaxCountLoading,
        isFetching: isMaxCountFetching,
        isError: isMaxCountError,
        refetch: refetchMaxCount
    } = useGetMaxCountQuery(formData);

    return (
        <BlockWithLoading
            title={`Максимальное количество полетов ${getTimeResolutionDescriptionFromEnum(formData.resolution)}`}
            data={maxCount?.maxFlightsCount}
            isLoading={isMaxCountLoading || isMaxCountFetching}
            isError={isMaxCountError}
            refetch={refetchMaxCount}
        />
    );
}

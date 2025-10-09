import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useFilterForm } from "@components/Dashboard/context";
import { useGetCountQuery } from "@store/analytics/api";

export default function CountBlock() {
    const formData = useFilterForm();

    const {
        data: count,
        isLoading: isCountLoading,
        isFetching: isCountFetching,
        refetch: refetchCount,
        isError: isCountError
    } = useGetCountQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    return (
        <BlockWithLoading
            title="Количество полетов"
            data={count?.flightsCount}
            isLoading={isCountLoading || isCountFetching}
            isError={isCountError}
            refetch={refetchCount}
        />
    );
}

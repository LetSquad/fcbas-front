import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useGetCountQuery } from "@store/analytics/api";

export default function CountBlock() {
    const { data: count, isLoading: isCountLoading, isError: isCountError, refetch: refetchCount } = useGetCountQuery(undefined);

    return (
        <BlockWithLoading
            title="Количество полетов"
            data={count?.flightsCount}
            isLoading={isCountLoading}
            isError={isCountError}
            refetch={refetchCount}
        />
    );
}

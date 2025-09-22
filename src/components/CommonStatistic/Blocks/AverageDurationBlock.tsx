import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useGetAverageDurationQuery } from "@store/analytics/api";

export default function AverageDurationBlock() {
    const {
        data: averageDuration,
        isLoading: isAverageDurationLoading,
        isError: isAverageDurationError,
        refetch: refetchAverageDuration
    } = useGetAverageDurationQuery(undefined);

    return (
        <BlockWithLoading
            title="Средняя длительность полета"
            data={averageDuration?.averageFlightDurationSeconds}
            isLoading={isAverageDurationLoading}
            isError={isAverageDurationError}
            refetch={refetchAverageDuration}
        />
    );
}

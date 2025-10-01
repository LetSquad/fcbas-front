import { Duration } from "luxon";

import BlockWithLoading from "@components/CommonStatistic/Blocks/BlockWithLoading";
import { useFilterFormContext } from "@components/Dashboard/context";
import { useGetAverageDurationQuery } from "@store/analytics/api";

export default function AverageDurationBlock() {
    const formData = useFilterFormContext();

    const {
        data: averageDuration,
        isLoading: isAverageDurationLoading,
        isFetching: isAverageDurationFetching,
        isError: isAverageDurationError,
        refetch: refetchAverageDuration
    } = useGetAverageDurationQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    return (
        <BlockWithLoading
            title="Средняя длительность полета"
            data={Duration.fromObject({ seconds: Number(averageDuration?.averageFlightDurationSeconds || 0) }).toFormat("hh:mm:ss")}
            isLoading={isAverageDurationLoading || isAverageDurationFetching}
            isError={isAverageDurationError}
            refetch={refetchAverageDuration}
        />
    );
}

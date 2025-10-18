import { mock } from "@api/api";
import apiUrls from "@api/apiUrls";

export async function setupAnalyticsMocks() {
    const [
        trend,
        trendByRegion,
        timeDistribution,
        timeDistributionByRegion,
        maxCount,
        maxCountByRegion,
        emptyDaysByRegion,
        densityByRegion,
        count,
        countByRegion,
        countByOperator,
        averageDuration,
        averageDurationByRegion,
        averageCount,
        averageCountByRegion,
        flightsBetweenRegions
    ] = await Promise.all([
        import("./trend.json"),
        import("./trendByRegion.json"),
        import("./timeDistribution.json"),
        import("./timeDistributionByRegion.json"),
        import("./maxCount.json"),
        import("./maxCountByRegion.json"),
        import("./emptyDaysByRegion.json"),
        import("./densityByRegion.json"),
        import("./count.json"),
        import("./countByRegion.json"),
        import("./countByOperator.json"),
        import("./averageDuration.json"),
        import("./averageDurationByRegion.json"),
        import("./averageCount.json"),
        import("./averageCountByRegion.json"),
        import("./flightsBetweenRegions.json")
    ]);

    mock.onGet(apiUrls.trend()).reply(200, trend);
    mock.onGet(apiUrls.trendByRegion()).reply(200, trendByRegion);
    mock.onGet(apiUrls.timeDistribution()).reply(200, timeDistribution);
    mock.onGet(apiUrls.timeDistributionByRegion()).reply(200, timeDistributionByRegion);
    mock.onGet(apiUrls.maxCount()).reply(200, maxCount);
    mock.onGet(apiUrls.maxCountByRegion()).reply(200, maxCountByRegion);
    mock.onGet(apiUrls.emptyDaysByRegion()).reply(200, emptyDaysByRegion);
    mock.onGet(apiUrls.densityByRegion()).reply(200, densityByRegion);
    mock.onGet(apiUrls.count()).reply(200, count);
    mock.onGet(apiUrls.countByRegion()).reply(200, countByRegion);
    mock.onGet(apiUrls.countByOperator()).reply(200, countByOperator);
    mock.onGet(apiUrls.averageDuration()).reply(200, averageDuration);
    mock.onGet(apiUrls.averageDurationByRegion()).reply(200, averageDurationByRegion);
    mock.onGet(apiUrls.averageCount()).reply(200, averageCount);
    mock.onGet(apiUrls.averageCountByRegion()).reply(200, averageCountByRegion);
    mock.onGet(apiUrls.flightsBetweenRegion()).reply(200, flightsBetweenRegions);
}

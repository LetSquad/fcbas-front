const externalUrl = process.env.EXTERNAL_URL || "https://localhost:8443";
const baseUrl = `${externalUrl}/api`;
const regionsUrl = `${baseUrl}/region`;
const flightUrl = `${baseUrl}/flight`;
const reportUrl = `${baseUrl}/report`;
const flightAnalyticsUrl = `${baseUrl}/analytics/flight`;

const apiUrls = {
    regions: () => regionsUrl,
    regionShape: () => `${regionsUrl}/shape`,
    flightData: () => `${flightUrl}/data`,
    reportFlights: () => `${reportUrl}/flights`,
    trend: () => `${flightAnalyticsUrl}/trend`,
    trendByRegion: () => `${flightAnalyticsUrl}/trend/by-region`,
    timeDistribution: () => `${flightAnalyticsUrl}/time-distribution`,
    timeDistributionByRegion: () => `${flightAnalyticsUrl}/time-distribution/by-region`,
    emptyDaysByRegion: () => `${flightAnalyticsUrl}/empty-days/by-region`,
    densityByRegion: () => `${flightAnalyticsUrl}/density/by-region`,
    count: () => `${flightAnalyticsUrl}/count`,
    countByRegion: () => `${flightAnalyticsUrl}/count/by-region`,
    maxCount: () => `${flightAnalyticsUrl}/max-count`,
    maxCountByRegion: () => `${flightAnalyticsUrl}/max-count/by-region`,
    averageDuration: () => `${flightAnalyticsUrl}/average-duration`,
    averageDurationByRegion: () => `${flightAnalyticsUrl}/average-duration/by-region`,
    averageCount: () => `${flightAnalyticsUrl}/average-count`,
    averageCountByRegion: () => `${flightAnalyticsUrl}/average-count/by-region`,
    flightsBetweenRegion: () => `${flightAnalyticsUrl}/between-region`
};

export default apiUrls;

import { ExecutorPagesData } from "@pages/ExecutorPages/ExecutorPagesData";
import { OperatorPagesData } from "@pages/OperatorPages/OperatorPagesData";

export const ExecutorItems: { name: string; url: string }[] = [
    {
        name: ExecutorPagesData.DASHBOARD.name,
        url: ExecutorPagesData.DASHBOARD.slug
    }
];

export const OperatorItems: { name: string; url: string }[] = [
    {
        name: OperatorPagesData.UPLOADER.name,
        url: OperatorPagesData.UPLOADER.slug
    },
    {
        name: OperatorPagesData.REPORTS.name,
        url: OperatorPagesData.REPORTS.slug
    }
];

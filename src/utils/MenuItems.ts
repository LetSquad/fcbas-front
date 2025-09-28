import { AdministratorPagesData } from "@pages/AdministratorPages/AdministratorPagesData";
import { OperatorPagesData } from "@pages/OperatorPages/OperatorPagesData";

export const ExecutorItems: { name: string; url: string }[] = [
    {
        name: OperatorPagesData.DASHBOARD.name,
        url: OperatorPagesData.DASHBOARD.slug
    }
];

export const OperatorItems: { name: string; url: string }[] = [
    {
        name: AdministratorPagesData.UPLOADER.name,
        url: AdministratorPagesData.UPLOADER.slug
    },
    {
        name: AdministratorPagesData.REPORTS.name,
        url: AdministratorPagesData.REPORTS.slug
    }
];

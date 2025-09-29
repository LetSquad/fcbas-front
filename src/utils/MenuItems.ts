import { AdministratorPagesData } from "@pages/AdministratorPages/AdministratorPagesData";
import { OperatorPagesData } from "@pages/OperatorPages/OperatorPagesData";

export const OperatorItems: { name: string; url: string }[] = [
    {
        name: OperatorPagesData.DASHBOARD.name,
        url: OperatorPagesData.DASHBOARD.slug
    }
];

export const AdministratorItems: { name: string; url: string }[] = [
    {
        name: AdministratorPagesData.ADMIN_PANEL.name,
        url: AdministratorPagesData.ADMIN_PANEL.slug
    }
];

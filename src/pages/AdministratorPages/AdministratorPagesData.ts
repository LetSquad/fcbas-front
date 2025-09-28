import { PageSlugs } from "@models/pages/enums";
import { PageData } from "@models/pages/types";

export const AdministratorPagesData: PageData = {
    UPLOADER: {
        name: "Загрузка данный",
        slug: PageSlugs.UPLOADER
    },
    REPORTS: {
        name: "Скачивание отчетов",
        slug: PageSlugs.REPORTS
    }
};

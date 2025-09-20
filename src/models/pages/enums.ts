export enum PageSlugs {
    BASE = "/",
    DASHBOARD = "/dashboard",
    UPLOADER = "/uploader",
    REPORTS = "/reports"
}

export enum ExecutorPageSlugs {
    DASHBOARD = PageSlugs.DASHBOARD
}

export enum OperatorPageSlugs {
    REPORTS = PageSlugs.REPORTS,
    UPLOADER = PageSlugs.UPLOADER
}

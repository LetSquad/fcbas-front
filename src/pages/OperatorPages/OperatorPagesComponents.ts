import { lazy } from "react";

import { PageComponents } from "@models/pages/types";

const Uploader = lazy(/* webpackChunkName: "Uploader" */ () => import("@components/Uploader"));
const Reports = lazy(/* webpackChunkName: "Reports" */ () => import("@components/Reports"));

export const OperatorPagesComponents: PageComponents = {
    UPLOADER: {
        component: Uploader
    },
    REPORTS: {
        component: Reports
    }
};

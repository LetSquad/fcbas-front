import { lazy } from "react";

import { PageComponents } from "@models/pages/types";

const Dashboard = lazy(/* webpackChunkName: "Dashboard" */ () => import("@components/Dashboard"));

export const ExecutorPagesComponents: PageComponents = {
    DASHBOARD: {
        component: Dashboard
    }
};

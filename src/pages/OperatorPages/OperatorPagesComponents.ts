import { lazy } from "react";

import { PageComponents } from "@models/pages/types";

const Dashboard = lazy(/* webpackChunkName: "Dashboard" */ () => import("@components/Dashboard"));

export const OperatorPagesComponents: PageComponents = {
    DASHBOARD: {
        component: Dashboard
    }
};

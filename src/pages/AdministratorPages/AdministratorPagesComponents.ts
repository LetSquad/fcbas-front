import { lazy } from "react";

import { PageComponents } from "@models/pages/types";

const AdminPanel = lazy(/* webpackChunkName: "AdminPanel" */ () => import("@components/AdminPanel"));

export const AdministratorPagesComponents: PageComponents = {
    ADMIN_PANEL: {
        component: AdminPanel
    }
};

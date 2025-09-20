import { useMemo } from "react";
import { Navigate, Route, Routes as RouterRoutes } from "react-router";

import merge from "lodash.merge";

import NotFoundErrorScreen from "@coreUtils/NotFoundErrorScreen";
import { useKeycloak } from "@hooks/useKeycloak";
import { Role } from "@models/auth/enums";
import { PageSlugs } from "@models/pages/enums";
import { Page } from "@models/pages/types";
import { ExecutorPages } from "@pages/ExecutorPages";
import { OperatorPages } from "@pages/OperatorPages";
import { pagesToRoutes } from "@pages/utils";

export default function Routes() {
    const {
        keycloak: { tokenParsed }
    } = useKeycloak();
    const roles = tokenParsed?.realm_access?.roles;

    const pages = useMemo(() => {
        let rolePages: Page = {};

        if (roles?.includes(Role.OPERATOR)) {
            rolePages = merge(rolePages, OperatorPages);
        }

        if (roles?.includes(Role.EXECUTOR)) {
            rolePages = merge(rolePages, ExecutorPages);
        }

        return rolePages;
    }, [roles]);

    const defaultNavigate = useMemo(() => {
        if (roles?.includes(Role.EXECUTOR)) {
            return <Navigate to={PageSlugs.DASHBOARD} replace />;
        }

        if (roles?.includes(Role.OPERATOR)) {
            return <Navigate to={PageSlugs.REPORTS} replace />;
        }

        return null;
    }, [roles]);

    return (
        <RouterRoutes>
            {pages && pagesToRoutes(pages)}
            {defaultNavigate && <Route path={PageSlugs.BASE} element={defaultNavigate} />}
            <Route key="not-found" path="*" element={<NotFoundErrorScreen />} />
        </RouterRoutes>
    );
}

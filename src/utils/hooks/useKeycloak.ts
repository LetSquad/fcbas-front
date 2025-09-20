import { useNavigate } from "react-router";

import Keycloak, { KeycloakLogoutOptions } from "keycloak-js";

import { Role } from "@models/auth/enums";
import { PageSlugs } from "@models/pages/enums";
import { useKeycloak as useKeycloakOriginal } from "@react-keycloak/web";

interface ReturnType {
    initialized: boolean;
    keycloak: Partial<Omit<Keycloak, "logout">> & { logout: ((options?: KeycloakLogoutOptions) => Promise<void>) | undefined };
}

export function useKeycloak(): ReturnType {
    const navigate = useNavigate();

    if (process.env.KEYCLOAK_ENABLED !== "true") {
        return {
            initialized: true,
            keycloak: {
                logout: undefined,
                authenticated: true,
                tokenParsed: {
                    realm_access: {
                        roles: [Role.OPERATOR, Role.EXECUTOR]
                    }
                }
            }
        };
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { initialized, keycloak } = useKeycloakOriginal();

    return {
        initialized,
        keycloak: {
            ...keycloak,
            logout: async (options?: KeycloakLogoutOptions) => {
                navigate(PageSlugs.BASE);
                await keycloak.logout(options);
            }
        }
    };
}

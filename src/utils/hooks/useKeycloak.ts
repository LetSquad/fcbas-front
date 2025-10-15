import Keycloak from "keycloak-js";

import { Role } from "@models/auth/enums";
import { useKeycloak as useKeycloakOriginal } from "@react-keycloak/web";

interface ReturnType {
    initialized: boolean;
    keycloak: Partial<Keycloak>;
}

export function useKeycloak(): ReturnType {
    if (process.env.KEYCLOAK_ENABLED !== "true") {
        return {
            initialized: true,
            keycloak: {
                token: "test123",
                logout: undefined,
                authenticated: true,
                tokenParsed: {
                    realm_access: {
                        roles: [Role.ADMINISTRATOR, Role.OPERATOR]
                    }
                }
            }
        };
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useKeycloakOriginal();
}

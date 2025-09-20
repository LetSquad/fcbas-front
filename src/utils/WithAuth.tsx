import { PropsWithChildren } from "react";

import { Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import Auth from "@components/Auth";
import RoleError from "@components/RoleError";
import { useKeycloak } from "@hooks/useKeycloak";
import { Role } from "@models/auth/enums";

export default function WithAuth(props: PropsWithChildren<object>) {
    const {
        keycloak: { authenticated, tokenParsed },
        initialized
    } = useKeycloak();

    if (!initialized) {
        return (
            <Flex alignContentCenter alignItemsCenter height100 width100>
                <Loader active inline="centered" />
            </Flex>
        );
    }

    if (!authenticated) {
        return <Auth />;
    }

    if (
        authenticated &&
        initialized &&
        !tokenParsed?.realm_access?.roles?.includes(Role.OPERATOR) &&
        !tokenParsed?.realm_access?.roles?.includes(Role.EXECUTOR)
    ) {
        return <RoleError />;
    }

    return props.children;
}

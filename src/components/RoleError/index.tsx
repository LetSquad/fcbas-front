import { useNavigate } from "react-router";

import { Button } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import { useKeycloak } from "@hooks/useKeycloak";
import { PageSlugs } from "@models/pages/enums";

export default function RoleError() {
    const navigate = useNavigate();

    const {
        keycloak: { logout }
    } = useKeycloak();

    return (
        <Flex column alignItemsCenter justifyCenter height100 width100 rowGap="7px">
            <span>В данный момент у вас нет доступа к системе</span>
            {logout && (
                <Button
                    negative
                    onClick={() => {
                        navigate(PageSlugs.BASE);
                        logout();
                    }}
                >
                    Выйти
                </Button>
            )}
        </Flex>
    );
}

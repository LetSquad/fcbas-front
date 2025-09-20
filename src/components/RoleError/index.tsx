import { Button } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import { useKeycloak } from "@hooks/useKeycloak";

export default function RoleError() {
    const {
        keycloak: { logout }
    } = useKeycloak();

    return (
        <Flex column alignItemsCenter justifyCenter height100 width100 rowGap="7px">
            <span>В данный момент у вас нет доступа к системе</span>
            {logout && (
                <Button negative onClick={() => logout()}>
                    Выйти
                </Button>
            )}
        </Flex>
    );
}

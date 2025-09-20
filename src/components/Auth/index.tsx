import { Button, Modal } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import { useKeycloak } from "@hooks/useKeycloak";

import styles from "./styles/Auth.module.scss";

export default function Auth() {
    const {
        keycloak: { login }
    } = useKeycloak();
    return (
        <Modal open closeOnDimmerClick={false} closeOnEscape={false} closeIcon={false} className={styles.modal} size="mini">
            <Flex alignItemsCenter justifyCenter height100 width100>
                {login && (
                    <Button primary onClick={() => login()}>
                        Авторизоваться
                    </Button>
                )}
            </Flex>
        </Modal>
    );
}

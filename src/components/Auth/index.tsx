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
            <Flex className={styles.container} column rowGap="15px" alignItemsCenter justifyCenter height100 width100>
                <span className={styles.title}>
                    Сервис для анализа количества и длительности полетов гражданских БПЛА в регионах Российской Федерации
                </span>
                {login && (
                    <Button primary onClick={() => login()}>
                        Авторизоваться
                    </Button>
                )}
            </Flex>
        </Modal>
    );
}

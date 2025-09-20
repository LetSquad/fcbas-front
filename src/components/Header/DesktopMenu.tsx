import { Button, Menu } from "semantic-ui-react";

import { useKeycloak } from "@hooks/useKeycloak";
import { useMenuOptions } from "@hooks/useMenuOptions";

import styles from "./styles/DesktopMenu.module.scss";
import headerStyles from "./styles/Header.module.scss";

export default function DesktopMenu() {
    const {
        keycloak: { logout }
    } = useKeycloak();
    const menuOptions = useMenuOptions();

    return (
        <>
            <div className={styles.itemsContainer}>{menuOptions}</div>
            {logout && (
                <Menu.Item position="right" className={headerStyles.buttonContainer}>
                    <Button primary className={headerStyles.button} onClick={() => logout()}>
                        Выйти
                    </Button>
                </Menu.Item>
            )}
        </>
    );
}

import { useNavigate } from "react-router";

import { Button, Menu } from "semantic-ui-react";

import { useKeycloak } from "@hooks/useKeycloak";
import { useMenuOptions } from "@hooks/useMenuOptions";
import { PageSlugs } from "@models/pages/enums";

import styles from "./styles/Header.module.scss";

export default function Header() {
    const navigate = useNavigate();

    const {
        keycloak: { logout }
    } = useKeycloak();

    const menuOptions = useMenuOptions();

    return (
        <Menu attached="top" className={styles.header}>
            <div className={styles.itemsContainer}>{menuOptions}</div>
            {logout && (
                <Menu.Item position="right" className={styles.buttonContainer}>
                    <Button
                        primary
                        className={styles.button}
                        onClick={() => {
                            logout().then(() => {
                                setTimeout(() => navigate(PageSlugs.BASE), 500);
                            });
                        }}
                    >
                        Выйти
                    </Button>
                </Menu.Item>
            )}
        </Menu>
    );
}

import React, { useCallback } from "react";
import { useMediaQuery } from "react-responsive";

import classNames from "classnames";
import { Icon, Menu } from "semantic-ui-react";

import DesktopMenu from "@components/Header/DesktopMenu";
import MobileMenu from "@components/Header/MobileMenu";
import { TABLET_MAX_WIDTH } from "@coreUtils/constants";
import { useKeycloak } from "@hooks/useKeycloak";
import { useMenuOptions } from "@hooks/useMenuOptions";
import { useToggle } from "@hooks/useToggle";

import styles from "./styles/Header.module.scss";

export default function Header() {
    const {
        keycloak: { logout }
    } = useKeycloak();

    const [isSidebarOpen, , openSidebar, closeSidebar] = useToggle();

    const menuOptions = useMenuOptions(closeSidebar);

    const isMobile = useMediaQuery({ maxWidth: TABLET_MAX_WIDTH });

    const onLogoutClick = useCallback(() => {
        closeSidebar();
        if (logout) {
            logout();
        }
    }, [closeSidebar, logout]);

    return (
        <>
            {isMobile && (
                <div className={isSidebarOpen ? styles.sidebarShow : styles.sidebarClose}>
                    <Icon name="close" link onClick={closeSidebar} size="big" className={styles.sidebarCloseIcon} />
                    <div className={styles.sidebarItemsContainer}>
                        {menuOptions}
                        {logout && (
                            <div aria-hidden className={styles.sidebarExitItem} onClick={onLogoutClick}>
                                Выйти
                            </div>
                        )}
                    </div>
                </div>
            )}
            <Menu attached="top" className={classNames(styles.header, styles.headerScroll)}>
                {isMobile ? <MobileMenu setSidebarOpen={openSidebar} /> : <DesktopMenu />}
            </Menu>
        </>
    );
}

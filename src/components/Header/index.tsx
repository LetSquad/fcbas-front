import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router";

import classNames from "classnames";
import { Icon, Menu } from "semantic-ui-react";

import DesktopMenu from "@components/Header/DesktopMenu";
import MobileMenu from "@components/Header/MobileMenu";
import { TABLET_MAX_WIDTH } from "@coreUtils/constants";
import { useKeycloak } from "@hooks/useKeycloak";
import { useMenuOptions } from "@hooks/useMenuOptions";
import { useToggle } from "@hooks/useToggle";
import { PageSlugs } from "@models/pages/enums";

import styles from "./styles/Header.module.scss";

export default function Header() {
    const navigate = useNavigate();

    const {
        keycloak: { logout }
    } = useKeycloak();

    const [position, setPosition] = useState(0);
    const [visible, setVisible] = useState(true);
    const [isSidebarOpen, , openSidebar, closeSidebar] = useToggle();

    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const lastScrollTopRef = useRef(0);

    const menuOptions = useMenuOptions(closeSidebar);

    const isMobile = useMediaQuery({ maxWidth: TABLET_MAX_WIDTH });

    const onLogoutClick = useCallback(() => {
        closeSidebar();
        if (logout) {
            navigate(PageSlugs.BASE);
            logout();
        }
    }, [closeSidebar, logout, navigate]);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;

        if (!container) {
            return;
        }

        const currentTop = container.scrollTop ?? 0;
        const previousTop = lastScrollTopRef.current;
        const isScrollingUp = currentTop < previousTop;

        setVisible(isScrollingUp || currentTop <= 0);
        lastScrollTopRef.current = currentTop;
        setPosition(currentTop);
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        const container = document.querySelector<HTMLElement>("#app");

        if (!container) {
            return;
        }

        scrollContainerRef.current = container;

        container.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

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
            <Menu
                attached="top"
                className={classNames(styles.header, {
                    [styles.headerVisible]: visible,
                    [styles.headerHidden]: !visible,
                    [styles.headerScroll]: position > 30
                })}
            >
                {isMobile ? <MobileMenu setSidebarOpen={openSidebar} /> : <DesktopMenu />}
            </Menu>
        </>
    );
}

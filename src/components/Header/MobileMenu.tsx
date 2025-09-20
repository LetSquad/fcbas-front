import { Dropdown, Icon, Menu } from "semantic-ui-react";

import styles from "./styles/MobileMenu.module.scss";

interface MobileMenuProps {
    setSidebarOpen: () => void;
}

export default function MobileMenu({ setSidebarOpen }: MobileMenuProps) {
    return (
        <Menu.Item position="right" header className={styles.headerItem}>
            <Dropdown
                item
                simple
                onClick={setSidebarOpen}
                icon={<Icon size="big" name="bars" className={styles.mobileDropdownIcon} />}
                className={styles.mobileDropdown}
            />
        </Menu.Item>
    );
}

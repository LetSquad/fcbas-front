import { useCallback } from "react";
import { Link } from "react-router";

import classNames from "classnames";

import { AdministratorItems, OperatorItems } from "@coreUtils/MenuItems";
import { useKeycloak } from "@hooks/useKeycloak";
import { useLocationActive } from "@hooks/useLocationActive";
import { Role } from "@models/auth/enums";

import styles from "./styles/useMenuOptions.module.scss";

export function useMenuOptions(onClose?: () => void) {
    const {
        keycloak: { tokenParsed }
    } = useKeycloak();

    const roles = tokenParsed?.realm_access?.roles;

    const isLocationActive = useLocationActive();

    const getOptions = useCallback(
        (menuOptions: { name: string; url: string }[]) =>
            menuOptions.map((option) => (
                <Link
                    to={option.url}
                    key={option.url}
                    className={classNames(styles.item, { [styles.itemActive]: isLocationActive(option.url) })}
                    onClick={() => {
                        if (onClose) {
                            onClose();
                        }
                    }}
                >
                    {option.name}
                </Link>
            )),
        [isLocationActive, onClose]
    );

    const options = [];

    if (roles?.includes(Role.OPERATOR)) {
        options.push(getOptions(OperatorItems));
    }

    if (roles?.includes(Role.ADMINISTRATOR)) {
        options.push(getOptions(AdministratorItems));
    }

    return options;
}

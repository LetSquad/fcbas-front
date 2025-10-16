import { Toast, toast } from "react-hot-toast";

import classNames from "classnames";
import { Icon } from "semantic-ui-react";

import styles from "./styles/CustomWarningToast.module.scss";

interface ListChangedToastProps {
    toast: Toast;
    text: string;
}

export default function CustomWarningToast({ toast: t, text }: ListChangedToastProps) {
    return (
        <div
            className={classNames(
                {
                    [styles.toastEnter]: t.visible,
                    [styles.toastExit]: !t.visible
                },
                styles.toast
            )}
        >
            <div className={styles.toastContent}>
                <Icon name="warning sign" color="orange" className={styles.toastIcon} />
                <span className={styles.toastText}>{text}</span>
            </div>
            <Icon name="remove" className={styles.toastDismissIcon} onClick={() => toast.dismiss(t.id)} link />
        </div>
    );
}

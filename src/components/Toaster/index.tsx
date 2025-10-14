import { toast, ToastBar, Toaster as HotToaster } from "react-hot-toast";

import { Icon } from "semantic-ui-react";

import styles from "./styles/Toaster.module.scss";

export default function Toaster() {
    return (
        <HotToaster
            position="bottom-right"
            gutter={8}
            toastOptions={{
                className: styles.toast,
                success: {
                    duration: 10_000
                },
                error: {
                    duration: 10_000
                }
            }}
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ icon, message }) => (
                        <>
                            {icon}
                            {message}
                            {t.type !== "loading" && (
                                <Icon name="remove" className={styles.toastDismissIcon} onClick={() => toast.dismiss(t.id)} link />
                            )}
                        </>
                    )}
                </ToastBar>
            )}
        </HotToaster>
    );
}

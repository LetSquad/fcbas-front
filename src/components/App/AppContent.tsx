import { WithSuspense } from "@coreUtils/WithSuspense";
import Routes from "@pages/Routes";

import styles from "./styles/AppContent.module.scss";

export default function AppContent() {
    return (
        <div className={styles.container}>
            <div className={styles.mainContentWrapper}>
                <WithSuspense>
                    <Routes />
                </WithSuspense>
            </div>
        </div>
    );
}

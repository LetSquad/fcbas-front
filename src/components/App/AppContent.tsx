import classNames from "classnames";

import { WithSuspense } from "@coreUtils/WithSuspense";
import Routes from "@pages/Routes";

import { useMapFullscreen } from "./context";
import styles from "./styles/AppContent.module.scss";

export default function AppContent() {
    const { isMapFullscreen } = useMapFullscreen();

    return (
        <div className={classNames(styles.container, { [styles.fullscreen]: isMapFullscreen })}>
            <div className={styles.mainContentWrapper}>
                <WithSuspense>
                    <Routes />
                </WithSuspense>
            </div>
        </div>
    );
}

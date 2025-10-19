import { useMemo, useState } from "react";

import AppContent from "@components/App/AppContent";
import Header from "@components/Header";

import { ExtendedModeContext, MapFullscreenContext } from "./context";
import styles from "./styles/App.module.scss";

export default function App() {
    const [isMapFullscreen, setMapFullscreen] = useState(false);
    const [isExtendedMode, setIsExtendedMode] = useState(false);

    const contextValue = useMemo(
        () => ({
            isMapFullscreen,
            setMapFullscreen
        }),
        [isMapFullscreen]
    );

    const extendedModeContextValue = useMemo(
        () => ({
            isExtendedMode,
            setIsExtendedMode
        }),
        [isExtendedMode]
    );

    return (
        <MapFullscreenContext.Provider value={contextValue}>
            <ExtendedModeContext.Provider value={extendedModeContextValue}>
                <div id="app" className={styles.app}>
                    {!isMapFullscreen && <Header />}
                    <AppContent />
                </div>
            </ExtendedModeContext.Provider>
        </MapFullscreenContext.Provider>
    );
}

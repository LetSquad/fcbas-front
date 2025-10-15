import { useMemo, useState } from "react";

import AppContent from "@components/App/AppContent";
import Header from "@components/Header";

import MapFullscreenContext from "./context";
import styles from "./styles/App.module.scss";

export default function App() {
    const [isMapFullscreen, setMapFullscreen] = useState(false);

    const contextValue = useMemo(
        () => ({
            isMapFullscreen,
            setMapFullscreen
        }),
        [isMapFullscreen]
    );

    return (
        <MapFullscreenContext.Provider value={contextValue}>
            <div id="app" className={styles.app}>
                {!isMapFullscreen && <Header />}
                <AppContent />
            </div>
        </MapFullscreenContext.Provider>
    );
}

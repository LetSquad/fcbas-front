import AppContent from "@components/App/AppContent";
import Header from "@components/Header";

import styles from "./styles/App.module.scss";

export default function App() {
    return (
        <div id="app" className={styles.app}>
            <Header />
            <AppContent />
        </div>
    );
}

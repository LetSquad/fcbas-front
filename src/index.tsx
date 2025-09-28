import "@coreStyles/globals.scss";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import App from "@components/App";
import WithAuth from "@coreUtils/WithAuth";
import WithErrorBoundaries from "@coreUtils/WithErrorBoundaries";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { store } from "@store/index";

if (process.env.KEYCLOAK_ENABLED === "true") {
    const keycloak = await import("@coreUtils/keycloak");

    createRoot(document.querySelector("#root") as Element).render(
        <WithErrorBoundaries>
            <ReactKeycloakProvider authClient={keycloak.keycloak} initOptions={keycloak.initOptions}>
                <BrowserRouter>
                    <WithAuth>
                        <Provider store={store}>
                            <App />
                        </Provider>
                    </WithAuth>
                </BrowserRouter>
            </ReactKeycloakProvider>
        </WithErrorBoundaries>
    );
} else {
    createRoot(document.querySelector("#root") as Element).render(
        <WithErrorBoundaries>
            <BrowserRouter>
                <Provider store={store}>
                    <App />
                </Provider>
            </BrowserRouter>
        </WithErrorBoundaries>
    );
}

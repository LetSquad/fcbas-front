import "@coreStyles/globals.scss";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import App from "@components/App";
import Toaster from "@components/Toaster";
import WithAuth from "@coreUtils/WithAuth";
import WithErrorBoundaries from "@coreUtils/WithErrorBoundaries";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { store } from "@store/index";

const base = (
    <>
        <BrowserRouter>
            <WithAuth>
                <Provider store={store}>
                    <App />
                </Provider>
            </WithAuth>
        </BrowserRouter>
        <Toaster />
    </>
);

if (process.env.KEYCLOAK_ENABLED === "true") {
    const keycloak = await import("@coreUtils/keycloak");

    createRoot(document.querySelector("#root") as Element).render(
        <WithErrorBoundaries>
            <ReactKeycloakProvider authClient={keycloak.keycloak} initOptions={keycloak.initOptions}>
                {base}
            </ReactKeycloakProvider>
        </WithErrorBoundaries>
    );
} else {
    createRoot(document.querySelector("#root") as Element).render(<WithErrorBoundaries>{base}</WithErrorBoundaries>);
}

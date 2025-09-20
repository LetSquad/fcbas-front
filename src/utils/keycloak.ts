import Keycloak from "keycloak-js";

// Instantiate Keycloak once, pointing at your realm and SPA client
export const keycloak = new Keycloak({
    url: process.env.KEYCLOAK_URL || "",
    realm: process.env.KEYCLOAK_REALM || "",
    clientId: process.env.KEYCLOAK_CLIENT_ID || ""
});

export const initOptions = {
    onLoad: "check-sso", // perform a silent session
    flow: "standard", // use the OIDC Authorization Code Flow
    pkceMethod: "S256", // enforce PKCE for extra SPA security
    silentCheckSsoRedirectUri: `${globalThis.location.origin}/silent-check-sso.html`,
    checkLoginIframe: true, // enable the hidden iframe for silent token refresh
    checkLoginIframeInterval: 30, // polling interval in seconds
    enableLogging: true // turn on adapter debug logging
};

import { useCallback } from "react";
import { useLocation } from "react-router";

export function useLocationActive() {
    const location = useLocation();

    return useCallback((path: string) => path === location.pathname, [location.pathname]);
}

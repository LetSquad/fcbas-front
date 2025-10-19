import { createContext, Dispatch, SetStateAction, useContext } from "react";

interface MapFullscreenContextValue {
    isMapFullscreen: boolean;
    setMapFullscreen: Dispatch<SetStateAction<boolean>>;
}

interface ExtendedModeContextValue {
    isExtendedMode: boolean;
    setIsExtendedMode: Dispatch<SetStateAction<boolean>>;
}

export const MapFullscreenContext = createContext<MapFullscreenContextValue | undefined>(undefined);
export const ExtendedModeContext = createContext<ExtendedModeContextValue | undefined>(undefined);

export function useMapFullscreen() {
    const context = useContext(MapFullscreenContext);

    if (!context) {
        throw new Error("useMapFullscreen должен использоваться внутри MapFullscreenContext.Provider");
    }

    return context;
}

export function useExtendedMode() {
    const ctx = useContext(ExtendedModeContext);

    if (!ctx) {
        throw new Error("useExtendedMode необходимо использовать внутри <ExtendedModeContext.Provider>");
    }

    return ctx;
}

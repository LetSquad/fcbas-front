import { createContext, Dispatch, SetStateAction, useContext } from "react";

interface MapFullscreenContextValue {
    isMapFullscreen: boolean;
    setMapFullscreen: Dispatch<SetStateAction<boolean>>;
}

const MapFullscreenContext = createContext<MapFullscreenContextValue | undefined>(undefined);

export function useMapFullscreen() {
    const context = useContext(MapFullscreenContext);

    if (!context) {
        throw new Error("useMapFullscreen должен использоваться внутри MapFullscreenContext.Provider");
    }

    return context;
}

export default MapFullscreenContext;

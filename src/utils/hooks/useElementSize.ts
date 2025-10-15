import { RefObject, useEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>) {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect;
            // округляем, чтобы не гуляли десятые пикселя
            setSize({ width: Math.round(cr.width), height: Math.round(cr.height) });
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);

    return size;
}

import { RefObject, useEffect, useRef } from "react";

import { ViewBox } from "@models/map/types";

interface UseAutoFitOnceOptions {
    svgRef: RefObject<SVGSVGElement | null>;
    width: number;
    height: number;
    zoom: number;
    pan: { x: number; y: number };
    viewBox: ViewBox;
    setZoom: (zoom: number) => void;
    setPan: (pan: { x: number; y: number }) => void;
}

/**
 * Один раз автоматически масштабирует карту, чтобы регионы поместились в видимую область.
 */
export function useAutoFitOnce({ svgRef, width, height, zoom, pan, viewBox, setZoom, setPan }: UseAutoFitOnceOptions) {
    const didAutoFitRef = useRef(false);

    useEffect(() => {
        if (didAutoFitRef.current) {
            return;
        }
        if (!svgRef.current) {
            return;
        }
        if (!width || !height) {
            return;
        }
        if (!(zoom === 1 && pan.x === 0 && pan.y === 0)) {
            return;
        }

        const layer = (svgRef.current.querySelector('g[data-layer="base"]') as SVGGraphicsElement | undefined) ?? svgRef.current;
        const bbox = layer.getBBox();
        if (!bbox.width || !bbox.height) {
            return;
        }

        const paddingY = bbox.height * 0.05;
        const paddedBBox = {
            x: bbox.x,
            y: bbox.y - paddingY,
            width: bbox.width,
            height: bbox.height + paddingY * 2
        };
        const zoomToFitH = viewBox.height / paddedBBox.height;

        const worldW = viewBox.width / zoomToFitH;
        const worldH = viewBox.height / zoomToFitH;

        const scaleCss = Math.min(width / worldW, height / worldH) || 1;
        const worldUnitsPerPx = 1 / scaleCss;

        const bboxCenterX = bbox.x + bbox.width / 2;
        const centerBias = -0.15;
        const biasWorld = worldW * centerBias;

        setZoom(zoomToFitH);
        setPan({
            x: (bboxCenterX - worldW / 2 - viewBox.minX + biasWorld) / worldUnitsPerPx,
            y: (bbox.y - viewBox.minY) / worldUnitsPerPx
        });

        didAutoFitRef.current = true;
    }, [height, pan.x, pan.y, setPan, setZoom, svgRef, viewBox, width, zoom]);
}

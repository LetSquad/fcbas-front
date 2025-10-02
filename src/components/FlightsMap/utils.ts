import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { HeatmapMode, TimeResolution } from "@models/analytics/enums";
import { MinMaxPoint, Point, ViewBox } from "@models/map/types";
import { RegionShape } from "@models/regions/types";

export function bezierForCentroids(a: RegionShape, b: RegionShape, tension = 0.18) {
    const [x1, y1] = a.centroid;
    const [x2, y2] = b.centroid;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const arc = len * tension;
    const cx = mx + nx * arc;
    const cy = my + ny * arc;

    return { p1: [x1, y1] as const, c: [cx, cy] as const, p2: [x2, y2] as const };
}

/**
 * Lightweight direction-based bundling: quantize angles into sectors and pull
 * control points a bit towards the sector's mean normal. Tuned by strength.
 */
export function bundledControlPoint(a: RegionShape, b: RegionShape, sectors = 12, strength = 0.4) {
    const { p1, p2 } = bezierForCentroids(a, b);
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const angle = Math.atan2(dy, dx);
    const sector = Math.round((angle / (2 * Math.PI)) * sectors);
    const snapped = (sector / sectors) * 2 * Math.PI;

    // Unit normal from snapped direction
    const nx = -Math.sin(snapped);
    const ny = Math.cos(snapped);
    const len = Math.hypot(dx, dy) || 1;
    const arc = len * 0.18;

    const cx = (p1[0] + p2[0]) / 2 + nx * arc * (0.5 + strength);
    const cy = (p1[1] + p2[1]) / 2 + ny * arc * (0.5 + strength);

    return { p1, c: [cx, cy] as const, p2 };
}

export function getCurrentViewBoxForPanZoom(
    base: ViewBox,
    panX: number,
    panY: number,
    zoomValue: number,
    pixelWidth: number,
    pixelHeight: number
) {
    const currentWidth = base.width / zoomValue;
    const currentHeight = base.height / zoomValue;

    const unitsPerPixelX = currentWidth / pixelWidth;
    const unitsPerPixelY = currentHeight / pixelHeight;

    const currentMinX = base.minX - panX * unitsPerPixelX;
    const currentMinY = base.minY - panY * unitsPerPixelY;

    return {
        minX: currentMinX,
        minY: currentMinY,
        width: currentWidth,
        height: currentHeight
    };
}

export function thicknessScreenPx(weight: number, zoom: number) {
    const spread = weight ** 0.55; // усиливаем контраст по весу
    const base = 1.4 + 6 * spread; // ~1.4…7.4 px на дальнем масштабе
    const zoomDampen = 1 + 0.9 * Math.max(0, zoom - 1);
    return base / zoomDampen; // при приближении — тоньше
}

export function opacity(weight: number, isHighlighted: boolean) {
    const eased = weight ** 0.65;
    let value = 0.06 + 0.92 * eased;

    if (isHighlighted) {
        value = Math.min(0.98, value + 0.1);
    }

    return value;
}

export function haloOpacity(weight: number) {
    const eased = weight ** 0.6;
    return 0.05 + 0.18 * eased;
}

function parseHex(hex: string) {
    const h = hex.replace("#", "");
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    return [r, g, b] as const;
}

function toHex2(x: number) {
    return x.toString(16).padStart(2, "0");
}

// Простой интерполятор цвета (hex → hex)
export function lerpColor(fromHex: string, toHex: string, tRaw: number) {
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const t = clamp(tRaw);

    const [r1, g1, b1] = parseHex(fromHex);
    const [r2, g2, b2] = parseHex(toHex);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function parsePreparedSvgFromText(svgText: string) {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-999999px";
    container.style.top = "-999999px";
    container.innerHTML = svgText.trim();

    const svgRoot = container.querySelector("svg");

    if (!svgRoot) {
        container.remove();
        throw new Error("SVG root not found");
    }

    document.body.append(container);

    try {
        const vbParts = (svgRoot.getAttribute("viewBox") || "0 0 1200 800").split(/\s+/).map(Number);

        const viewBox: ViewBox = {
            minX: vbParts[0],
            minY: vbParts[1],
            width: vbParts[2],
            height: vbParts[3]
        };

        const nodeList = svgRoot.querySelectorAll<SVGGraphicsElement>("[data-code]");
        const shapeElements = [...nodeList];

        const regions: RegionShape[] = shapeElements
            .map((element) => {
                const tag = element.tagName.toLowerCase();
                const code = element.dataset.code || "";
                const id = Number(element.dataset.id);
                const name = element.dataset.name || `Region ${code}`;

                // Преобразуем circle/ellipse в pathD (две дуги A), для path берём d как есть
                let d: string;
                if (tag === "path") {
                    d = element.getAttribute("d") || "";
                } else if (tag === "circle" || tag === "ellipse") {
                    const cxAttr = element.getAttribute("cx");
                    const cyAttr = element.getAttribute("cy");
                    const rxAttr = element.getAttribute(tag === "circle" ? "r" : "rx");
                    const ryAttr = element.getAttribute(tag === "circle" ? "r" : "ry");

                    // fallback из bbox, если каких-то атрибутов нет (чтобы не упасть)
                    const bboxFallback = element.getBBox();
                    const cx = cxAttr === null ? bboxFallback.x + bboxFallback.width / 2 : Number(cxAttr);
                    const cy = cyAttr === null ? bboxFallback.y + bboxFallback.height / 2 : Number(cyAttr);
                    const rx = rxAttr === null ? Math.max(0.01, bboxFallback.width / 2) : Number(rxAttr);
                    const ry = ryAttr === null ? Math.max(0.01, bboxFallback.height / 2) : Number(ryAttr);

                    // Эллипс/круг как две полуокружности:
                    // M (cx-rx, cy) A rx ry 0 1 0 (cx+rx, cy) A rx ry 0 1 0 (cx-rx, cy) Z
                    const x0 = cx - rx;
                    const x1 = cx + rx;
                    const y0 = cy;
                    d = `M ${x0} ${y0} A ${rx} ${ry} 0 1 0 ${x1} ${y0} A ${rx} ${ry} 0 1 0 ${x0} ${y0} Z`;
                } else {
                    // Неподдерживаемые элементы пропускаем (если вдруг попадутся)
                    d = "";
                }

                const bbox = element.getBBox();
                const centroidX = bbox.x + bbox.width / 2;
                const centroidY = bbox.y + bbox.height / 2;

                const isBubble = tag === "circle" || tag === "ellipse";

                return {
                    code,
                    id,
                    name,
                    isBubble,
                    pathD: d,
                    centroid: [centroidX, centroidY] as Point,
                    bbox: [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height] as MinMaxPoint
                };
            })
            .filter((r) => r.pathD);

        return { viewBox, regions };
    } finally {
        container.remove();
    }
}

export function getHeatMapLabelFromHeatmapModeEnum(value: HeatmapMode, timeResolution: TimeResolution) {
    switch (value) {
        case HeatmapMode.COUNT: {
            return "Количество полетов";
        }
        case HeatmapMode.AVERAGE_DURATION: {
            return "Продолжительность полетов";
        }
        case HeatmapMode.AVERAGE_COUNT: {
            return `Среднее количество полетов ${getTimeResolutionDescriptionFromEnum(timeResolution)}`;
        }
        case HeatmapMode.MEDIAN_COUNT: {
            return `Медианное количество полетов ${getTimeResolutionDescriptionFromEnum(timeResolution)}`;
        }
        case HeatmapMode.EMPTY_DAYS_COUNT: {
            return "Количество дней без полетов";
        }
        case HeatmapMode.DENSITY: {
            return `Плотность полетов`;
        }
        case HeatmapMode.MAX_COUNT: {
            return `Максимальное количество полетов ${getTimeResolutionDescriptionFromEnum(timeResolution)}`;
        }
        // skip default
    }
}

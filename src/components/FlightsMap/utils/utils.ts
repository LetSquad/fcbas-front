import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import { HeatmapMode, TimeResolution } from "@models/analytics/enums";
import { HeatmapDomain, MinMaxPoint, Point, ViewBox } from "@models/map/types";
import { RegionShape } from "@models/regions/types";

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

    // SVG использует режим preserveAspectRatio="xMidYMid meet", поэтому обе оси масштабируются одинаково.
    // Это означает, что фактическая ширина/высота карты внутри контейнера может быть меньше, чем pixelWidth/pixelHeight из-за «letterbox».
    // Чтобы курсор и карта перемещались синхронно, нужно учитывать фактический масштаб, а не размер контейнера.
    const scale = Math.min(pixelWidth / currentWidth, pixelHeight / currentHeight) || 1;
    const worldUnitsPerPixel = 1 / scale;

    const currentMinX = base.minX - panX * worldUnitsPerPixel;
    const currentMinY = base.minY - panY * worldUnitsPerPixel;

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

export function getMeetFromCurrentViewBox(
    current: ViewBox,
    cssWidth: number, // ширина контейнера/элемента в CSS px (как prop width)
    cssHeight: number, // высота контейнера в CSS px (как prop height)
    dpr: number
) {
    const desiredWidth = Math.floor(cssWidth * dpr); // внутренний буфер canvas
    const desiredHeight = Math.floor(cssHeight * dpr);

    // масштаб в CSS-пикселях
    const scaleCss = Math.min(cssWidth / current.width, cssHeight / current.height);

    // масштаб в device-пикселях (то, что идёт в context.setTransform)
    const scale = scaleCss * dpr;

    // «письма» в device-пикселях: просто остаток буфера canvas
    const offsetX = (desiredWidth - current.width * scale) / 2;
    const offsetY = (desiredHeight - current.height * scale) / 2;

    return {
        minX: current.minX,
        minY: current.minY,
        scaleScreenPerWorld: scale,
        offsetXpx: offsetX,
        offsetYpx: offsetY,
        desiredWidth,
        desiredHeight
    };
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
        case HeatmapMode.BETWEEN_REGIONS_COUNT: {
            return "Перелеты в другие регионы";
        }
        // skip default
    }
}

// Извлекаем бинарную маску (0/1) из canvas ImageData -> distance map (float)
// Chamfer DT (3-4) в два прохода, 8-соседей: быстро и достаточно точно.
function distanceTransform(canvas: HTMLCanvasElement): Float32Array {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, w, h);

    // маска: 1 — внутри региона, 0 — фон
    const inside = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        // заполняли чёрным -> внутри: R==0 && A>0
        inside[p] = data[i + 3] > 0 && data[i] === 0 ? 1 : 0;
    }

    const inf = 1e9;
    const dist = new Float32Array(w * h);
    for (let i = 0; i < dist.length; i++) {
        dist[i] = inside[i] ? inf : 0;
    }

    // forward pass
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (!inside[i]) {
                continue;
            }
            let d = dist[i];
            // лево/верх и диагонали
            if (x > 0) {
                d = Math.min(d, dist[i - 1] + 3);
            }
            if (y > 0) {
                d = Math.min(d, dist[i - w] + 3);
                if (x > 0) {
                    d = Math.min(d, dist[i - w - 1] + 4);
                }
                if (x + 1 < w) {
                    d = Math.min(d, dist[i - w + 1] + 4);
                }
            }
            dist[i] = d;
        }
    }
    // backward pass
    for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
            const i = y * w + x;
            if (!inside[i]) {
                continue;
            }
            let d = dist[i];
            if (x + 1 < w) {
                d = Math.min(d, dist[i + 1] + 3);
            }
            if (y + 1 < h) {
                d = Math.min(d, dist[i + w] + 3);
                if (x + 1 < w) {
                    d = Math.min(d, dist[i + w + 1] + 4);
                }
                if (x > 0) {
                    d = Math.min(d, dist[i + w - 1] + 4);
                }
            }
            dist[i] = d;
        }
    }

    // нормализация в «пиксели»
    for (let i = 0; i < dist.length; i++) {
        dist[i] = dist[i] === inf ? 0 : dist[i] / 3; // 3 == стоимость по прямым
    }
    return dist;
}

// Простейшая эрозия маски внутрь на px (защита от прилипания к границе).
function erodeMask(canvas: HTMLCanvasElement, px: number) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(img.data);
    const dst = img.data;
    for (let p = 0; p < px; p++) {
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = (y * w + x) * 4;
                // если любой сосед фон — делаем фон
                let keep = true;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) {
                            continue;
                        }
                        const j = ((y + dy) * w + (x + dx)) * 4;
                        if (src[j + 3] === 0) {
                            keep = false;
                        }
                    }
                }

                if (keep) {
                    dst[i] = 0;
                    dst[i + 1] = 0;
                    dst[i + 2] = 0;
                    dst[i + 3] = 255;
                } else {
                    dst[i] = 255;
                    dst[i + 1] = 255;
                    dst[i + 2] = 255;
                    dst[i + 3] = 0;
                }
            }
        }
        src.set(dst);
    }
    ctx.putImageData(img, 0, 0);
}

// Box blur радиуса r по месту для Float32Array
function boxBlur(buf: Float32Array, w: number, h: number, r: number) {
    if (r <= 0) {
        return;
    }
    const tmp = new Float32Array(buf.length);
    // по X
    for (let y = 0; y < h; y++) {
        let acc = 0;
        const row = y * w;
        for (let x = -r; x <= r; x++) {
            acc += buf[row + Math.max(0, Math.min(w - 1, x))];
        }
        tmp[row] = acc / (2 * r + 1);
        for (let x = 1; x < w; x++) {
            const add = buf[row + Math.min(w - 1, x + r)];
            const rem = buf[row + Math.max(0, x - r - 1)];
            acc += add - rem;
            tmp[row + x] = acc / (2 * r + 1);
        }
    }
    // по Y
    for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) {
            acc += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
        }
        buf[x] = acc / (2 * r + 1);
        for (let y = 1; y < h; y++) {
            const add = tmp[Math.min(h - 1, y + r) * w + x];
            const rem = tmp[Math.max(0, y - r - 1) * w + x];
            acc += add - rem;
            buf[y * w + x] = acc / (2 * r + 1);
        }
    }
}

// Быстрый "визуальный центр" через растровую маску + distance transform.
// Работает надёжнее на полумесяцах, узких перешейках и сложных составных контурах.
export function computeVisualCenter(
    path: SVGPathElement,
    opts?: {
        maxTexture?: number; // макс. размер offscreen-канвы по большей стороне
        blurFrac?: number; // сглаживание расстояний (стабилизирует пик)
        safetyShrink?: number; // "усадка" маски внутрь, чтобы не прилипало к краям
    }
): [number, number] {
    const { maxTexture = 640, blurFrac = 0.02, safetyShrink = 0.75 } = opts ?? {};
    const d = path.getAttribute("d");
    if (!d) {
        const b = path.getBBox();
        return [b.x + b.width / 2, b.y + b.height / 2];
    }

    // 1) Ббокс и масштаб растра
    const bbox = path.getBBox();
    const w = Math.max(2, Math.ceil(bbox.width));
    const h = Math.max(2, Math.ceil(bbox.height));
    const scale = Math.min(1, maxTexture / Math.max(w, h));
    const rw = Math.max(2, Math.ceil(w * scale));
    const rh = Math.max(2, Math.ceil(h * scale));

    // 2) Рисуем маску региона
    const off = document.createElement("canvas");
    off.width = rw;
    off.height = rh;
    const ctx = off.getContext("2d")!;
    ctx.translate(-bbox.x * scale, -bbox.y * scale);
    ctx.scale(scale, scale);

    const p2d = new Path2D(d);
    ctx.fill(p2d, "evenodd"); // корректно обрабатываем дыры
    ctx.fillStyle = "#000";
    ctx.fill(p2d);

    // опционально "усаживаем" маску внутрь (в пикселях растра),
    // чтобы якорь гарантированно не лип к границе в узких местах
    if (safetyShrink > 0) {
        const px = Math.max(0, Math.round(Math.min(rw, rh) * (safetyShrink / 100)));
        if (px > 0) {
            erodeMask(off, px);
        }
    }

    // 3) Строим карту расстояний (8-соседей, chamfer 3-4)
    const dist = distanceTransform(off);

    // 4) Небольшое размытие — боремся с «островными пиками» на перешейках
    const blurPx = Math.max(0, Math.round(Math.min(rw, rh) * blurFrac));
    if (blurPx > 0) {
        boxBlur(dist, rw, rh, blurPx);
    }

    // 5) Ищем максимум расстояния (центр «самой толстой» части суши)
    let bestVal = -1;
    let bestX = 0;
    let bestY = 0;
    for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
            const v = dist[y * rw + x];
            if (v > bestVal) {
                bestVal = v;
                bestX = x;
                bestY = y;
            }
        }
    }

    // 6) Возвращаем в координаты исходного SVG
    const sx = bestX / scale + bbox.x;
    const sy = bestY / scale + bbox.y;
    return [sx, sy];
}

// Контрольная точка кривой (аналог вашей bundled-логики)
export function makeCurve(p1: [number, number], p2: [number, number], bend = 12, strength = 0.35) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    // перпендикуляр в сторону «северо-востока», чтобы дуги выглядели как у вас
    const nx = -dy / len;
    const ny = dx / len;
    const c: [number, number] = [mx + nx * bend * strength, my + ny * bend * strength];
    return { p1, p2, c };
}

export function normalizeDomain(domain: HeatmapDomain): HeatmapDomain {
    if (domain.min === Number.POSITIVE_INFINITY) {
        return { min: 0, max: 0 };
    }

    return domain;
}

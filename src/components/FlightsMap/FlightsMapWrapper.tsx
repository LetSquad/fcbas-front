import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Loader } from "semantic-ui-react";

import mapSvgText from "@assets/images/map.svg?raw";
import Flex from "@commonComponents/Flex";
import FlightsMap from "@components/FlightsMap/index";
import { parsePreparedSvgFromText } from "@components/FlightsMap/utils";
import { ViewBox } from "@models/map/types";
import { Region, RegionShape } from "@models/regions/types";

import styles from "./styles/FightsMapWrapper.module.scss";

// Простой кеш геометрии: чтобы не вызывать getBBox() каждый маунт
const geometryCache = new Map<string, { viewBox: ViewBox; regions: RegionShape[] }>();

export interface FlightsMapWrapperProps {
    regions: Record<number, Region>;
    onRegionClick?: (regionId: number) => void;
    strictMatch?: boolean; // показывать только регионы из бэка (по умолчанию true)
}

export default function FlightsMapWrapper({ regions, onRegionClick, strictMatch = true }: FlightsMapWrapperProps) {
    // Контейнер для авторазмера
    const holderRef = useRef<HTMLDivElement | null>(null);

    // Состояния карты и размеров
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [viewBox, setViewBox] = useState<ViewBox | null>(null);
    const [regionShapes, setRegionShapes] = useState<RegionShape[] | null>(null);
    const [aspect, setAspect] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1) Парсинг геометрии из импортированного SVG (один раз, с кешем)
    useEffect(() => {
        try {
            setError(null);

            const cacheKey = "map.svg";

            if (geometryCache.has(cacheKey)) {
                const cached = geometryCache.get(cacheKey)!;

                setViewBox(cached.viewBox);
                setRegionShapes(cached.regions);
                setAspect(cached.viewBox.height / cached.viewBox.width);
            } else {
                const parsed = parsePreparedSvgFromText(mapSvgText);

                geometryCache.set(cacheKey, parsed);
                setViewBox(parsed.viewBox);
                setRegionShapes(parsed.regions);
                setAspect(parsed.viewBox.height / parsed.viewBox.width);
            }
        } catch (unknownError: any) {
            setError(unknownError?.message || String(unknownError));
        }
    }, []);

    // 2) Объединяем имена из бэка по id. По умолчанию скрываем регионы, которых нет в backend.
    const [mergedRegions, setMergedRegions] = useState<Record<number, RegionShape>>();

    useEffect(() => {
        if (!regionShapes) {
            return;
        }

        const backendByCode = new Map<string, Region>();
        const regionsArray = Object.values(regions);

        for (const backendRegion of regionsArray) {
            backendByCode.set(backendRegion.code, backendRegion);
        }

        const joined: Record<number, RegionShape> = {};

        for (const region of regionShapes) {
            const meta = backendByCode.get(region.code);

            if (meta) {
                joined[region.id] = { ...region, name: meta.name || region.name };
            } else if (!strictMatch) {
                joined[region.id] = region;
            }
        }

        // Предупреждение: в бэке есть id, которых нет в SVG
        const svgCodes = new Set(regionShapes.map((region) => region.code));
        const missingCodes: string[] = [];

        for (const backendRegion of regionsArray) {
            if (!svgCodes.has(backendRegion.code)) {
                missingCodes.push(backendRegion.code);
            }
        }

        if (missingCodes.length > 0) {
            console.warn("[Слейка карты] Регионы пришли с backend, но отсутствуют в svg:", missingCodes);
        }

        setMergedRegions(joined);
    }, [regionShapes, regions, strictMatch]);

    // 3) Авторазмер контейнера с сохранением аспекта viewBox
    useLayoutEffect(() => {
        if (!holderRef.current) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;

            if (!rect) {
                return;
            }

            let widthPx = rect.width;
            let heightPx = rect.height;

            if (aspect && widthPx > 0) {
                heightPx = widthPx * aspect;

                if (rect.height > 0 && heightPx > rect.height) {
                    heightPx = rect.height;
                    widthPx = heightPx / aspect;
                }
            }

            setSize({
                width: Math.max(1, Math.floor(widthPx)),
                height: Math.max(1, Math.floor(heightPx))
            });
        });

        observer.observe(holderRef.current);

        return function cleanupObserver() {
            observer.disconnect();
        };
    }, [aspect]);

    // 4) Рендер обёртки
    return (
        <div ref={holderRef} className={styles.container}>
            {error && (
                <div className={styles.errorContainer}>
                    Ошибка загрузки карты:
                    {error}
                </div>
            )}

            {!error && (!size || !viewBox || !mergedRegions) && (
                <Flex alignContentCenter alignItemsCenter height100 width100>
                    <Loader active inline="centered" />
                </Flex>
            )}

            {size && viewBox && mergedRegions && (
                <FlightsMap
                    viewBox={viewBox}
                    regions={mergedRegions}
                    width={size.width}
                    height={size.height}
                    onRegionClick={onRegionClick}
                />
            )}
        </div>
    );
}

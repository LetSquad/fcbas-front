import { KeyboardEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Dimmer, Loader } from "semantic-ui-react";

import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import Overlays from "@components/FlightsMap/Overlays";
import {
    bundledControlPoint,
    getCurrentViewBoxForPanZoom,
    haloOpacity,
    lerpColor,
    opacity,
    thicknessScreenPx
} from "@components/FlightsMap/utils";
import { usePanZoom } from "@hooks/usePanZoom";
import { HeatmapMode } from "@models/analytics/enums";
import { FlightBetweenRegions, HeatMapInfo } from "@models/analytics/types";
import { ViewBox } from "@models/map/types";
import { RegionShape } from "@models/regions/types";
import {
    useGetAverageCountByRegionQuery,
    useGetAverageDurationByRegionQuery,
    useGetCountByRegionQuery,
    useGetDensityByRegionQuery,
    useGetEmptyDaysByRegionQuery,
    useGetFlightsBetweenRegionQuery
} from "@store/analytics/api";

import styles from "./styles/FlightsMap.module.scss";

export interface FlightsMapProps {
    viewBox: ViewBox;
    regions: Record<number, RegionShape>;
    width: number;
    height: number;
    onRegionClick?: (regionId: number) => void;
}

const STYLE = {
    // Линии межрегиональные
    gradientStart: "#f97316",
    gradientEnd: "#c2410c",

    // Подсветка связей выбранного региона
    selectedBoost: {
        thicknessMult: 1.15,
        opacityAdd: 0.08
    },

    // Цвета теплокарты (от «холодного» к «горячему»)
    heatLow: "#ccd2e1",
    heatHigh: "#1e3a8a"
} as const;

export default function FlightsMap({ viewBox, regions, width, height, onRegionClick }: FlightsMapProps) {
    const {
        data: countByRegions,
        isLoading: isCountByRegionsLoading,
        isError: isCountByRegionsError,
        refetch: refetchCountByRegions
    } = useGetCountByRegionQuery(undefined);

    const {
        data: averageDurationByRegions,
        isLoading: isAverageDurationByRegionsLoading,
        isError: isAverageDurationByRegionsError,
        refetch: refetchAverageDurationByRegions
    } = useGetAverageDurationByRegionQuery(undefined);

    const {
        data: averageCountByRegions,
        isLoading: isAverageCountByRegionsLoading,
        isError: isAverageCountByRegionsError,
        refetch: refetchAverageCountByRegions
    } = useGetAverageCountByRegionQuery(undefined);

    const {
        data: emptyDaysByRegions,
        isLoading: isEmptyDaysByRegionsLoading,
        isError: isEmptyDaysByRegionsError,
        refetch: refetchEmptyDaysByRegions
    } = useGetEmptyDaysByRegionQuery(undefined);

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isError: isDensityByRegionsError,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery(undefined);

    const {
        data: flightsBetweenRegion,
        isLoading: isFlightsBetweenRegionLoading,
        isError: isFlightsBetweenRegionError,
        refetch: refetchFlightsBetweenRegion
    } = useGetFlightsBetweenRegionQuery(undefined);

    const topFly = flightsBetweenRegion?.topFly;
    const regionFlights = flightsBetweenRegion?.regionFlights;
    const topFlightsCount = flightsBetweenRegion?.count;

    const { zoom, pan, onWheel, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, consumeDragFlag } = usePanZoom();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
    const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(HeatmapMode.COUNT);
    const [showFlows, setShowFlows] = useState<boolean>(true);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; text: string }>({
        x: 0,
        y: 0,
        visible: false,
        text: ""
    });

    const animationFrameRef = useRef<number | null>(null);
    const latestRef = useRef({
        width,
        height,
        pan,
        zoom,
        viewBox,
        visibleBetweenRegionFlows: [] as FlightBetweenRegions[],
        selectedRegionId,
        showFlows
    });

    const currentViewBox = getCurrentViewBoxForPanZoom(viewBox, pan.x, pan.y, zoom, width, height);

    const intraByRegion = useMemo(() => {
        const map = new Map<number, HeatMapInfo>();

        if (!countByRegions || !averageDurationByRegions || !averageCountByRegions || !emptyDaysByRegions || !densityByRegions) {
            return map;
        }

        for (const [, region] of Object.entries(regions)) {
            map.set(region.id, {
                flightCount: countByRegions.regionsMap[region.id] || 0,
                averageFlightDurationSeconds: averageDurationByRegions.regionsMap[region.id] || 0,
                averageFlightCount: averageCountByRegions.regionsMap[region.id].averageFlightsCount || 0,
                medianFlightCount: averageCountByRegions.regionsMap[region.id].medianFlightsCount || 0,
                emptyDays: emptyDaysByRegions.regionsMap[region.id] || 0,
                density: densityByRegions.regionsMap[region.id] || 0
            });
        }

        return map;
    }, [averageCountByRegions, averageDurationByRegions, countByRegions, densityByRegions, emptyDaysByRegions, regions]);

    const heatDomains = useMemo(() => {
        let minCount = Number.POSITIVE_INFINITY;
        let maxCount = 0;
        let minAverageDuration = Number.POSITIVE_INFINITY;
        let maxAverageDuration = 0;
        let minAverageCount = Number.POSITIVE_INFINITY;
        let maxAverageCount = 0;
        let minMedianCount = Number.POSITIVE_INFINITY;
        let maxMedianCount = 0;
        let minEmptyDaysCount = Number.POSITIVE_INFINITY;
        let maxEmptyDaysCount = 0;
        let minDensity = Number.POSITIVE_INFINITY;
        let maxDensity = 0;

        for (const [, region] of Object.entries(regions)) {
            const regionHetMapInfo = intraByRegion.get(region.id);

            if (!regionHetMapInfo) {
                continue;
            }

            if (regionHetMapInfo.flightCount < minCount) {
                minCount = regionHetMapInfo.flightCount;
            }

            if (regionHetMapInfo.flightCount > maxCount) {
                maxCount = regionHetMapInfo.flightCount;
            }

            if (regionHetMapInfo.averageFlightDurationSeconds < minAverageDuration) {
                minAverageDuration = regionHetMapInfo.averageFlightDurationSeconds;
            }

            if (regionHetMapInfo.averageFlightDurationSeconds > maxAverageDuration) {
                maxAverageDuration = regionHetMapInfo.averageFlightDurationSeconds;
            }

            if (regionHetMapInfo.averageFlightCount < minAverageCount) {
                minAverageCount = regionHetMapInfo.averageFlightCount;
            }

            if (regionHetMapInfo.averageFlightCount > maxAverageCount) {
                maxAverageCount = regionHetMapInfo.averageFlightCount;
            }

            if (regionHetMapInfo.medianFlightCount < minMedianCount) {
                minMedianCount = regionHetMapInfo.medianFlightCount;
            }

            if (regionHetMapInfo.medianFlightCount > maxMedianCount) {
                maxMedianCount = regionHetMapInfo.medianFlightCount;
            }

            if (regionHetMapInfo.emptyDays < minEmptyDaysCount) {
                minEmptyDaysCount = regionHetMapInfo.emptyDays;
            }

            if (regionHetMapInfo.emptyDays > maxEmptyDaysCount) {
                maxEmptyDaysCount = regionHetMapInfo.emptyDays;
            }

            if (regionHetMapInfo.density < minDensity) {
                minDensity = regionHetMapInfo.density;
            }

            if (regionHetMapInfo.density > maxDensity) {
                maxDensity = regionHetMapInfo.density;
            }
        }

        if (minCount === Number.POSITIVE_INFINITY) {
            minCount = 0;
        }

        if (minAverageDuration === Number.POSITIVE_INFINITY) {
            minAverageDuration = 0;
        }

        if (minAverageCount === Number.POSITIVE_INFINITY) {
            minAverageCount = 0;
        }

        if (minMedianCount === Number.POSITIVE_INFINITY) {
            minMedianCount = 0;
        }

        if (minEmptyDaysCount === Number.POSITIVE_INFINITY) {
            minEmptyDaysCount = 0;
        }

        if (minDensity === Number.POSITIVE_INFINITY) {
            minDensity = 0;
        }

        return {
            [HeatmapMode.COUNT]: { min: minCount, max: maxCount },
            [HeatmapMode.AVERAGE_DURATION]: { min: minAverageDuration, max: maxAverageDuration },
            [HeatmapMode.AVERAGE_COUNT]: { min: minAverageCount, max: maxAverageCount },
            [HeatmapMode.MEDIAN_COUNT]: { min: minMedianCount, max: maxMedianCount },
            [HeatmapMode.EMPTY_DAYS_COUNT]: { min: minEmptyDaysCount, max: maxEmptyDaysCount },
            [HeatmapMode.DENSITY]: { min: minDensity, max: maxDensity }
        };
    }, [regions, intraByRegion]);

    const getHeatValue = useCallback(
        (regionId: number) => {
            const heatMapInfo = intraByRegion.get(regionId);
            if (!heatMapInfo) {
                return null;
            }

            switch (heatmapMode) {
                case HeatmapMode.COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.flightCount - min) / (max - min);
                }
                case HeatmapMode.AVERAGE_DURATION: {
                    const { min, max } = heatDomains[HeatmapMode.AVERAGE_DURATION];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.averageFlightDurationSeconds - min) / (max - min);
                }
                case HeatmapMode.AVERAGE_COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.AVERAGE_COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.averageFlightCount - min) / (max - min);
                }
                case HeatmapMode.MEDIAN_COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.MEDIAN_COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.medianFlightCount - min) / (max - min);
                }
                case HeatmapMode.EMPTY_DAYS_COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.EMPTY_DAYS_COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.emptyDays - min) / (max - min);
                }
                case HeatmapMode.DENSITY: {
                    const { min, max } = heatDomains[HeatmapMode.DENSITY];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.density - min) / (max - min);
                }
                default: {
                    return 0;
                }
            }
        },
        [intraByRegion, heatDomains, heatmapMode]
    );

    const heatColorForRegion = useCallback(
        (regionId: number, isSelected: boolean) => {
            const heatValue = getHeatValue(regionId);

            if (heatValue === null) {
                return isSelected ? "#d9e4ff" : STYLE.heatLow;
            }

            const base = lerpColor(STYLE.heatLow, STYLE.heatHigh, heatValue);

            if (!isSelected) {
                return base;
            }

            return lerpColor(base, "#3b82f6", 0.12);
        },
        [getHeatValue]
    );

    const visibleBetweenRegionFlows = useMemo(
        () => (selectedRegionId === null ? topFly || [] : regionFlights?.[selectedRegionId] || []),
        [selectedRegionId, topFly, regionFlights]
    );

    const bringToFront = useCallback((element: SVGElement | null) => {
        if (!element) {
            return;
        }

        const group = element.closest("g[data-layer]"); // ближайший слой

        if (group) {
            group.append(element); // станет последним в своём слое
        }
    }, []);

    const handleClearSelection = useCallback(() => {
        if (selectedRegionId !== null) {
            setSelectedRegionId(null);
        }
    }, [selectedRegionId]);

    const handleRegionClick = useCallback(
        (svgMouseEvent: MouseEvent<SVGSVGElement>) => {
            if (consumeDragFlag()) {
                return;
            }

            // клик мог попасть в stroke/заливку — находим именно <path data-region-id>
            const pathElement = (svgMouseEvent.target as Element)?.closest?.("path[data-region-id]") as SVGPathElement;
            const regionIdAttr = pathElement?.getAttribute?.("data-region-id");

            if (regionIdAttr) {
                const id = Number(regionIdAttr);

                // поднимаем выбранный путь наверх (последним в своём <g>)
                bringToFront(pathElement);

                setSelectedRegionId((cur) => (cur === id ? null : id));
                if (onRegionClick) {
                    onRegionClick(id);
                }
            }
        },
        [consumeDragFlag, onRegionClick, bringToFront]
    );

    const handleContainerKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Escape" && selectedRegionId !== null) {
                event.preventDefault();
                setSelectedRegionId(null);
            }
        },
        [selectedRegionId]
    );

    // Рисуем межрегиональную линию без анимации и без подписи + маркеры направления
    const drawInterRegionFlow = useCallback(
        (flow: FlightBetweenRegions, context: CanvasRenderingContext2D, _nowMs: number, pixelsPerWorldX: number) => {
            const departureRegion = regions[flow.departureRegionId];
            const destinationRegion = regions[flow.destinationRegionId];

            if (!departureRegion || !destinationRegion) {
                return;
            }

            const curve = bundledControlPoint(departureRegion, destinationRegion, 12, 0.35);
            const normalizedWeight = 1;

            const isEdgeOfSelected =
                selectedRegionId !== null && (flow.departureRegionId === selectedRegionId || flow.destinationRegionId === selectedRegionId);

            // тоньше
            let thicknessScreenPxValue = thicknessScreenPx(normalizedWeight, 1) * 0.8;
            let opacityValue = opacity(normalizedWeight, isEdgeOfSelected);

            if (isEdgeOfSelected) {
                thicknessScreenPxValue *= STYLE.selectedBoost.thicknessMult;
                opacityValue = Math.min(1, opacityValue + STYLE.selectedBoost.opacityAdd);
            }

            const lineWidthWorld = thicknessScreenPxValue / pixelsPerWorldX;
            const haloWideWorld = (thicknessScreenPxValue * 2) / pixelsPerWorldX;
            const haloNarrowWorld = (thicknessScreenPxValue * 1.35) / pixelsPerWorldX;

            const gradientStroke = context.createLinearGradient(curve.p1[0], curve.p1[1], curve.p2[0], curve.p2[1]);
            gradientStroke.addColorStop(0, STYLE.gradientStart);
            gradientStroke.addColorStop(1, STYLE.gradientEnd);

            // HALO 1
            context.save();
            context.lineCap = "round";
            context.lineJoin = "round";
            context.globalAlpha = Math.max(0, Math.min(1, haloOpacity(normalizedWeight) * 0.65));
            context.strokeStyle = STYLE.gradientEnd;
            context.lineWidth = haloWideWorld;
            context.beginPath();
            context.moveTo(curve.p1[0], curve.p1[1]);
            context.quadraticCurveTo(curve.c[0], curve.c[1], curve.p2[0], curve.p2[1]);
            context.stroke();
            context.restore();

            // HALO 2
            context.save();
            context.lineCap = "round";
            context.lineJoin = "round";
            context.globalAlpha = Math.max(0, Math.min(1, haloOpacity(normalizedWeight) * 0.55));
            context.strokeStyle = gradientStroke;
            context.lineWidth = haloNarrowWorld;
            context.beginPath();
            context.moveTo(curve.p1[0], curve.p1[1]);
            context.quadraticCurveTo(curve.c[0], curve.c[1], curve.p2[0], curve.p2[1]);
            context.stroke();
            context.restore();

            // ОСНОВНАЯ ЛИНИЯ
            context.save();
            context.lineCap = "round";
            context.lineJoin = "round";
            context.globalAlpha = 1;
            context.strokeStyle = gradientStroke;
            context.lineWidth = lineWidthWorld;
            context.setLineDash([10, 10]);
            context.lineDashOffset = 0;

            context.beginPath();
            context.moveTo(curve.p1[0], curve.p1[1]);
            context.quadraticCurveTo(curve.c[0], curve.c[1], curve.p2[0], curve.p2[1]);
            context.stroke();
            context.restore();

            // МАРКЕРЫ НАПРАВЛЕНИЯ
            const originRadiusWorld = Math.max(1 / pixelsPerWorldX, (thicknessScreenPxValue * 0.9) / pixelsPerWorldX);
            const destRadiusWorld = Math.max(1 / pixelsPerWorldX, (thicknessScreenPxValue * 1.1) / pixelsPerWorldX);

            // origin (пустой)
            context.save();
            context.globalAlpha = Math.min(1, opacityValue + 0.1);
            context.lineWidth = Math.max(1 / pixelsPerWorldX, 0.75 / pixelsPerWorldX);
            context.strokeStyle = STYLE.gradientStart;
            context.beginPath();
            context.arc(curve.p1[0], curve.p1[1], originRadiusWorld, 0, Math.PI * 2);
            context.stroke();
            context.restore();

            // destination (залитый)
            context.save();
            context.globalAlpha = Math.min(1, opacityValue + 0.1);
            context.fillStyle = STYLE.gradientEnd;
            context.beginPath();
            context.arc(curve.p2[0], curve.p2[1], destRadiusWorld, 0, Math.PI * 2);
            context.fill();
            context.restore();
        },
        [regions, selectedRegionId]
    );

    const drawFrame = useCallback(
        (now: number, context: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement, isMounted: boolean) => {
            if (!isMounted) {
                return;
            }

            const {
                width: curWidth,
                height: curHeight,
                pan: curPan,
                zoom: curZoom,
                viewBox: baseViewBox,
                visibleBetweenRegionFlows: curVisibleFlows,
                showFlows: curShowFlows
            } = latestRef.current;

            const dpr = window.devicePixelRatio || 1;
            const desiredWidth = Math.floor(curWidth * dpr);
            const desiredHeight = Math.floor(curHeight * dpr);

            if (canvasElement.width !== desiredWidth || canvasElement.height !== desiredHeight) {
                canvasElement.width = desiredWidth;
                canvasElement.height = desiredHeight;
            }

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);
            context.globalAlpha = 1;

            const currentWidthInWorld = baseViewBox.width / curZoom;
            const currentHeightInWorld = baseViewBox.height / curZoom;

            const unitsPerPixelX = currentWidthInWorld / curWidth;
            const unitsPerPixelY = currentHeightInWorld / curHeight;

            const currentMinX = baseViewBox.minX - curPan.x * unitsPerPixelX;
            const currentMinY = baseViewBox.minY - curPan.y * unitsPerPixelY;

            const pixelsPerWorldX = (curWidth / currentWidthInWorld) * dpr;
            const pixelsPerWorldY = (curHeight / currentHeightInWorld) * dpr;

            context.setTransform(pixelsPerWorldX, 0, 0, pixelsPerWorldY, -currentMinX * pixelsPerWorldX, -currentMinY * pixelsPerWorldY);

            if (curShowFlows) {
                for (const flow of curVisibleFlows) {
                    drawInterRegionFlow(flow, context, now, pixelsPerWorldX);
                }
            }

            animationFrameRef.current = requestAnimationFrame((_now) => drawFrame(_now, context, canvasElement, isMounted));
        },
        [drawInterRegionFlow]
    );

    const selectedRegionName = selectedRegionId === null ? undefined : regions[selectedRegionId]?.name || `Регион ${selectedRegionId}`;
    const selectedRegionIntra =
        selectedRegionId === null ? undefined : intraByRegion.get(selectedRegionId) || { flightCount: 0, averageFlightDurationSeconds: 0 };

    const handleSvgMouseMove = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const target = event.target as SVGElement | null;
            const regionIdAttr = (target as SVGPathElement)?.getAttribute?.("data-region-id");

            if (regionIdAttr) {
                const id = Number(regionIdAttr);
                const name = regions[id]?.name || `Регион ${id}`;
                // позиционирование относительно контейнера
                const containerRect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();

                setTooltip({
                    x: event.clientX - containerRect.left + 12,
                    y: event.clientY - containerRect.top + 12,
                    visible: true,
                    text: name
                });
            } else {
                setTooltip((_tooltip) => ({ ..._tooltip, visible: false }));
            }
        },
        [regions]
    );

    const handleSvgMouseLeave = useCallback(() => {
        setTooltip((_tooltip) => ({ ..._tooltip, visible: false }));
    }, []);

    const svgPaths = useMemo(() => {
        const regionsArray = Object.values(regions);
        const baseRegions = regionsArray.filter((region) => !region.isBubble);
        const bubbleRegions = regionsArray.filter((region) => region.isBubble);

        const renderPath = (region: RegionShape) => {
            const isSelected = selectedRegionId !== null && selectedRegionId === region.id;
            const fill = heatColorForRegion(region.id, isSelected);

            return (
                <path
                    key={region.id}
                    d={region.pathD}
                    data-region-id={region.id}
                    data-layer={region.isBubble ? "bubble" : "base"} // помечаем слой на элементе
                    fill={fill}
                    role="button"
                    tabIndex={0}
                    id={`region-${region.id}`}
                    stroke={isSelected ? "#131317" : "#a1a9b5"}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    aria-pressed={isSelected}
                    aria-label={region.name}
                    className={styles.path}
                />
            );
        };

        return (
            <>
                {/* Слой обычных регионов — ниже */}
                <g data-layer="base">{baseRegions.map((element) => renderPath(element))}</g>

                {/* Слой «пузырей» (круги/эллипсы) — ВСЕГДА сверху */}
                <g data-layer="bubble">{bubbleRegions.map((element) => renderPath(element))}</g>
            </>
        );
    }, [heatColorForRegion, regions, selectedRegionId]);

    useEffect(() => {
        latestRef.current = {
            width,
            height,
            pan,
            zoom,
            viewBox,
            visibleBetweenRegionFlows,
            selectedRegionId,
            showFlows
        };
    }, [width, height, pan, zoom, viewBox, visibleBetweenRegionFlows, selectedRegionId, showFlows]);

    useEffect(() => {
        const canvasElement = canvasRef.current;

        if (canvasElement === null) {
            return;
        }

        const context = canvasElement.getContext("2d");

        if (context === null) {
            return;
        }

        let isMounted = true;
        animationFrameRef.current = requestAnimationFrame((now) => drawFrame(now, context, canvasElement, isMounted));

        return () => {
            isMounted = false;

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [drawFrame, drawInterRegionFlow]);

    if (
        isAverageDurationByRegionsError ||
        isCountByRegionsError ||
        isFlightsBetweenRegionError ||
        isAverageCountByRegionsError ||
        isEmptyDaysByRegionsError ||
        isDensityByRegionsError
    ) {
        return (
            <LoadingErrorBlock
                isLoadingErrorObjectText="данных для карты"
                reload={() => {
                    if (isAverageDurationByRegionsError) {
                        refetchAverageDurationByRegions();
                    } else if (isCountByRegionsError) {
                        refetchCountByRegions();
                    } else if (isFlightsBetweenRegionError) {
                        refetchFlightsBetweenRegion();
                    } else if (isAverageCountByRegionsError) {
                        refetchAverageCountByRegions();
                    } else if (isEmptyDaysByRegionsError) {
                        refetchEmptyDaysByRegions();
                    } else if (isDensityByRegionsError) {
                        refetchDensityByRegions();
                    }
                }}
            />
        );
    }

    return (
        <div
            className={styles.container}
            role="presentation"
            aria-label="Карта полётов: колесом мыши — масштабирование, перетаскиванием — панорамирование, клик — выбор линии"
            onKeyDown={handleContainerKeyDown}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onContextMenu={(event) => event.preventDefault()}
        >
            {(isAverageDurationByRegionsLoading ||
                isCountByRegionsLoading ||
                isFlightsBetweenRegionLoading ||
                isAverageCountByRegionsLoading ||
                isEmptyDaysByRegionsLoading ||
                isDensityByRegionsLoading) && (
                <Dimmer active>
                    <Loader />
                </Dimmer>
            )}
            <svg
                width={width}
                height={height}
                viewBox={`${currentViewBox.minX} ${currentViewBox.minY} ${currentViewBox.width} ${currentViewBox.height}`}
                preserveAspectRatio="none"
                className={styles.svg}
                role="img"
                aria-label="Карта регионов России"
                onContextMenu={(event) => event.preventDefault()}
                onClick={handleRegionClick}
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={handleSvgMouseLeave}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        handleClearSelection();
                    }
                }}
            >
                {svgPaths}
            </svg>

            <canvas ref={canvasRef} width={width} height={height} className={styles.canvas} />

            {/* Tooltip подсказка по региону */}
            {tooltip.visible && (
                <div
                    className={styles.tooltip}
                    style={{
                        left: tooltip.x,
                        top: tooltip.y
                    }}
                >
                    {tooltip.text}
                </div>
            )}

            {!isAverageDurationByRegionsLoading && !isCountByRegionsLoading && !isFlightsBetweenRegionLoading && (
                <Overlays
                    // Легенда всегда показывается
                    selectionActive={selectedRegionId !== null}
                    selectedRegionName={selectedRegionName}
                    selectedIntraCount={selectedRegionIntra?.flightCount || 0}
                    selectedIntraAvgDurationSec={selectedRegionIntra?.averageFlightDurationSeconds || 0}
                    heatmapMode={heatmapMode}
                    onChangeHeatmapMode={setHeatmapMode}
                    heatDomains={heatDomains}
                    // цвета для мини-градиента
                    heatLowColor={STYLE.heatLow}
                    heatHighColor={STYLE.heatHigh}
                    // переключатель линий
                    showFlows={showFlows}
                    topFlightsCount={topFlightsCount}
                    onToggleShowFlows={setShowFlows}
                />
            )}
        </div>
    );
}

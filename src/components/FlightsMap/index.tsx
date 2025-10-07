import { KeyboardEvent, MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Duration } from "luxon";
import { Dimmer, Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useFilterFormContext } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import Overlays from "@components/FlightsMap/Overlays";
import {
    computeVisualCenter,
    getCurrentViewBoxForPanZoom,
    getMeetFromCurrentViewBox,
    haloOpacity,
    lerpColor,
    makeCurve,
    opacity,
    thicknessScreenPx
} from "@components/FlightsMap/utils";
import { useElementSize } from "@hooks/useElementSize";
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
    useGetFlightsBetweenRegionQuery,
    useGetMaxCountByRegionQuery
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
    gradientStart: "#FFE0B3",
    gradientEnd: "#FF6F00",

    // Подсветка связей выбранного региона
    selectedBoost: {
        thicknessMult: 0.9,
        opacityAdd: 0.08
    },

    // Цвета теплокарты (от «холодного» к «горячему»)
    heatLow: "#B3D9FF",
    heatHigh: "#254b6e"
};

export default function FlightsMap({ viewBox, regions, width, height, onRegionClick }: FlightsMapProps) {
    const formData = useFilterFormContext();

    const {
        data: countByRegions,
        isLoading: isCountByRegionsLoading,
        isFetching: isCountByRegionsFetching,
        isError: isCountByRegionsError,
        refetch: refetchCountByRegions
    } = useGetCountByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: averageDurationByRegions,
        isLoading: isAverageDurationByRegionsLoading,
        isFetching: isAverageDurationByRegionsFetching,
        isError: isAverageDurationByRegionsError,
        refetch: refetchAverageDurationByRegions
    } = useGetAverageDurationByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: averageCountByRegions,
        isLoading: isAverageCountByRegionsLoading,
        isFetching: isAverageCountByRegionsFetching,
        isError: isAverageCountByRegionsError,
        refetch: refetchAverageCountByRegions
    } = useGetAverageCountByRegionQuery(formData);

    const {
        data: emptyDaysByRegions,
        isLoading: isEmptyDaysByRegionsLoading,
        isFetching: isEmptyDaysByRegionsFetching,
        isError: isEmptyDaysByRegionsError,
        refetch: refetchEmptyDaysByRegions
    } = useGetEmptyDaysByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: densityByRegions,
        isLoading: isDensityByRegionsLoading,
        isFetching: isDensityByRegionsFetching,
        isError: isDensityByRegionsError,
        refetch: refetchDensityByRegions
    } = useGetDensityByRegionQuery({ startDate: formData.startDate, finishDate: formData.finishDate });

    const {
        data: maxCountByRegions,
        isLoading: isMaxCountByRegionsLoading,
        isFetching: isMaxCountByRegionsFetching,
        isError: isMaxCountByRegionsError,
        refetch: refetchMaxCountByRegions
    } = useGetMaxCountByRegionQuery(formData);

    const {
        data: flightsBetweenRegion,
        isLoading: isFlightsBetweenRegionLoading,
        isError: isFlightsBetweenRegionError,
        refetch: refetchFlightsBetweenRegion
    } = useGetFlightsBetweenRegionQuery();

    const topFly = flightsBetweenRegion?.topFly;
    const regionFlights = flightsBetweenRegion?.regionFlights;
    const topFlightsCount = flightsBetweenRegion?.count;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const didAutoFitRef = useRef(false);
    const anchorsRef = useRef<Map<number, [number, number]>>(new Map());

    const measured = useElementSize<HTMLDivElement>(containerRef);
    const cssW = measured.width || width; // fallback на пропcы, если 0 в первый рендер
    const cssH = measured.height || height;

    const { zoom, pan, setZoom, setPan, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, consumeDragFlag } = usePanZoom({
        containerRef
    });

    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
    const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(HeatmapMode.COUNT);
    const [showFlows, setShowFlows] = useState<boolean>(true);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; text: ReactNode }>({
        x: 0,
        y: 0,
        visible: false,
        text: null
    });

    const currentViewBox = getCurrentViewBoxForPanZoom(viewBox, pan.x, pan.y, zoom, cssW, cssH);

    const animationFrameRef = useRef<number>(null);
    const latestRef = useRef({
        width: cssW,
        height: cssH,
        pan,
        zoom,
        viewBox,
        currentViewBox,
        visibleBetweenRegionFlows: [] as FlightBetweenRegions[],
        selectedRegionId,
        showFlows
    });

    const intraByRegion = useMemo(() => {
        const map = new Map<number, HeatMapInfo>();

        if (
            !countByRegions ||
            !averageDurationByRegions ||
            !averageCountByRegions ||
            !emptyDaysByRegions ||
            !densityByRegions ||
            !maxCountByRegions
        ) {
            return map;
        }

        for (const [, region] of Object.entries(regions)) {
            map.set(region.id, {
                flightCount: countByRegions.regionsMap[region.id] || 0,
                averageFlightDurationSeconds: averageDurationByRegions.regionsMap[region.id] || 0,
                averageFlightCount: averageCountByRegions.regionsMap[region.id].averageFlightsCount || 0,
                medianFlightCount: averageCountByRegions.regionsMap[region.id].medianFlightsCount || 0,
                emptyDays: emptyDaysByRegions.regionsMap[region.id] || 0,
                density: densityByRegions.regionsMap[region.id] || 0,
                maxCount: maxCountByRegions.regionsMap[region.id].maxFlightsCount || 0
            });
        }

        return map;
    }, [averageCountByRegions, averageDurationByRegions, countByRegions, densityByRegions, emptyDaysByRegions, maxCountByRegions, regions]);

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
        let minMaxCount = Number.POSITIVE_INFINITY;
        let maxMaxCount = 0;

        for (const [, region] of Object.entries(regions)) {
            const regionHeatMapInfo = intraByRegion.get(region.id);

            if (!regionHeatMapInfo) {
                continue;
            }

            if (regionHeatMapInfo.flightCount < minCount) {
                minCount = regionHeatMapInfo.flightCount;
            }

            if (regionHeatMapInfo.flightCount > maxCount) {
                maxCount = regionHeatMapInfo.flightCount;
            }

            if (regionHeatMapInfo.averageFlightDurationSeconds < minAverageDuration) {
                minAverageDuration = regionHeatMapInfo.averageFlightDurationSeconds;
            }

            if (regionHeatMapInfo.averageFlightDurationSeconds > maxAverageDuration) {
                maxAverageDuration = regionHeatMapInfo.averageFlightDurationSeconds;
            }

            if (regionHeatMapInfo.averageFlightCount < minAverageCount) {
                minAverageCount = regionHeatMapInfo.averageFlightCount;
            }

            if (regionHeatMapInfo.averageFlightCount > maxAverageCount) {
                maxAverageCount = regionHeatMapInfo.averageFlightCount;
            }

            if (regionHeatMapInfo.medianFlightCount < minMedianCount) {
                minMedianCount = regionHeatMapInfo.medianFlightCount;
            }

            if (regionHeatMapInfo.medianFlightCount > maxMedianCount) {
                maxMedianCount = regionHeatMapInfo.medianFlightCount;
            }

            if (regionHeatMapInfo.emptyDays < minEmptyDaysCount) {
                minEmptyDaysCount = regionHeatMapInfo.emptyDays;
            }

            if (regionHeatMapInfo.emptyDays > maxEmptyDaysCount) {
                maxEmptyDaysCount = regionHeatMapInfo.emptyDays;
            }

            if (regionHeatMapInfo.density < minDensity) {
                minDensity = Math.round(regionHeatMapInfo.density * 100) / 100;
            }

            if (regionHeatMapInfo.density > maxDensity) {
                maxDensity = Math.round(regionHeatMapInfo.density * 100) / 100;
            }

            if (regionHeatMapInfo.maxCount < minMaxCount) {
                minMaxCount = regionHeatMapInfo.maxCount;
            }

            if (regionHeatMapInfo.maxCount > maxMaxCount) {
                maxMaxCount = regionHeatMapInfo.maxCount;
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

        if (minMaxCount === Number.POSITIVE_INFINITY) {
            minMaxCount = 0;
        }

        return {
            [HeatmapMode.COUNT]: { min: minCount, max: maxCount },
            [HeatmapMode.AVERAGE_DURATION]: { min: minAverageDuration, max: maxAverageDuration },
            [HeatmapMode.AVERAGE_COUNT]: { min: minAverageCount, max: maxAverageCount },
            [HeatmapMode.MEDIAN_COUNT]: { min: minMedianCount, max: maxMedianCount },
            [HeatmapMode.EMPTY_DAYS_COUNT]: { min: minEmptyDaysCount, max: maxEmptyDaysCount },
            [HeatmapMode.DENSITY]: { min: minDensity, max: maxDensity },
            [HeatmapMode.MAX_COUNT]: { min: minMaxCount, max: maxMaxCount }
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
                case HeatmapMode.MAX_COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.MAX_COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.maxCount - min) / (max - min);
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

            return "#b54a4a";
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
        (event: KeyboardEvent) => {
            if (event.key === "Escape" && selectedRegionId !== null) {
                event.preventDefault();
                setSelectedRegionId(null);
            }
        },
        [selectedRegionId]
    );

    const getRegionAnchor = useCallback((regionId: number, svgRoot: SVGSVGElement) => {
        const cached = anchorsRef.current.get(regionId);
        if (cached) {
            return cached;
        }

        const path: SVGPathElement | null = svgRoot.querySelector(`path[data-region-id="${regionId}"]`);
        if (!path) {
            return null;
        }

        const anchor = computeVisualCenter(path);
        anchorsRef.current.set(regionId, anchor);
        return anchor;
    }, []);

    // Рисуем межрегиональную линию без анимации и без подписи + маркеры направления
    const drawInterRegionFlow = useCallback(
        (flow: FlightBetweenRegions, context: CanvasRenderingContext2D, _nowMs: number, pixelsPerWorldX: number) => {
            const departureRegion = regions[flow.departureRegionId];
            const destinationRegion = regions[flow.destinationRegionId];
            if (!departureRegion || !destinationRegion || !svgRef.current) {
                return;
            }

            const a1 = getRegionAnchor(flow.departureRegionId, svgRef.current);
            const a2 = getRegionAnchor(flow.destinationRegionId, svgRef.current);
            if (!a1 || !a2) {
                return;
            }

            // делаем кривую по новым якорям
            const curve = makeCurve(a1, a2, 12, 0.35);
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
            const haloWideWorld = (thicknessScreenPxValue * 1.5) / pixelsPerWorldX;
            const haloNarrowWorld = (thicknessScreenPxValue * 1.1) / pixelsPerWorldX;

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
        [getRegionAnchor, regions, selectedRegionId]
    );

    const drawFrame = useCallback(
        (now: number, context: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement, isMounted: boolean) => {
            if (!isMounted) {
                return;
            }

            const {
                width: curWidth,
                height: curHeight,
                currentViewBox: curViewBox,
                visibleBetweenRegionFlows: curVisibleFlows,
                showFlows: curShowFlows
            } = latestRef.current;

            const dpr = window.devicePixelRatio || 1;

            const { minX, minY, scaleScreenPerWorld, offsetXpx, offsetYpx, desiredWidth, desiredHeight } = getMeetFromCurrentViewBox(
                curViewBox,
                curWidth,
                curHeight,
                dpr
            );

            // гарантируем корректный размер внутреннего буфера под DPR
            if (canvasElement.width !== desiredWidth || canvasElement.height !== desiredHeight) {
                canvasElement.width = desiredWidth;
                canvasElement.height = desiredHeight;
            }

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // ЕДИНЫЙ масштаб + правильные offsets, всё в device px
            context.setTransform(
                scaleScreenPerWorld,
                0,
                0,
                scaleScreenPerWorld,
                -minX * scaleScreenPerWorld + offsetXpx,
                -minY * scaleScreenPerWorld + offsetYpx
            );

            if (curShowFlows) {
                for (const flow of curVisibleFlows) {
                    drawInterRegionFlow(flow, context, now, scaleScreenPerWorld);
                }
            }

            animationFrameRef.current = requestAnimationFrame((_now) => drawFrame(_now, context, canvasElement, isMounted));
        },
        [drawInterRegionFlow]
    );

    const selectedRegionName = selectedRegionId === null ? undefined : regions[selectedRegionId]?.name || `Регион ${selectedRegionId}`;
    const selectedRegionIntra =
        selectedRegionId === null
            ? undefined
            : intraByRegion.get(selectedRegionId) || {
                  flightCount: 0,
                  averageFlightDurationSeconds: 0,
                  averageFlightCount: 0,
                  medianFlightCount: 0,
                  emptyDays: 0,
                  density: 0,
                  maxCount: 0
              };

    const getTooltipContent = useCallback(
        (regionId: number) => {
            const name = regions[regionId]?.name || `Регион ${regionId}`;

            const heatMapInfo = intraByRegion.get(regionId);
            if (!heatMapInfo) {
                return name;
            }

            let content;

            switch (heatmapMode) {
                case HeatmapMode.COUNT: {
                    content = `Количество полетов: ${heatMapInfo.flightCount}`;
                    break;
                }
                case HeatmapMode.AVERAGE_DURATION: {
                    content = `Средняя длительность полета: ${Duration.fromObject({ seconds: heatMapInfo.averageFlightDurationSeconds }).toFormat("hh:mm:ss")}`;
                    break;
                }
                case HeatmapMode.AVERAGE_COUNT: {
                    content = `Среднее количество полетов (${getTimeResolutionDescriptionFromEnum(formData.resolution)}): ${heatMapInfo.averageFlightCount}`;
                    break;
                }
                case HeatmapMode.MEDIAN_COUNT: {
                    content = `Медианное количество полетов (${getTimeResolutionDescriptionFromEnum(formData.resolution)}): ${heatMapInfo.medianFlightCount}`;
                    break;
                }
                case HeatmapMode.EMPTY_DAYS_COUNT: {
                    content = `Количество дней без полетов: ${heatMapInfo.emptyDays}`;
                    break;
                }
                case HeatmapMode.DENSITY: {
                    content = `Плотность полетов: ${Math.round((heatMapInfo.density * 100) / 100)}`;
                    break;
                }
                case HeatmapMode.MAX_COUNT: {
                    content = `Максимальное количество полетов: ${heatMapInfo.maxCount}`;
                    break;
                }
                default: {
                    return name;
                }
            }

            return (
                <Flex column rowGap="5px">
                    <span>{name}</span>
                    {content && <span>{content}</span>}
                </Flex>
            );
        },
        [formData.resolution, heatmapMode, intraByRegion, regions]
    );

    const handleSvgMouseMove = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const target = event.target as SVGElement | null;
            const regionIdAttr = (target as SVGPathElement)?.getAttribute?.("data-region-id");

            if (regionIdAttr) {
                const id = Number(regionIdAttr);
                // позиционирование относительно контейнера
                const containerRect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();

                setTooltip({
                    x: event.clientX - containerRect.left + 12,
                    y: event.clientY - containerRect.top + 12,
                    visible: true,
                    text: getTooltipContent(id)
                });
            } else {
                setTooltip((_tooltip) => ({ ..._tooltip, visible: false }));
            }
        },
        [getTooltipContent]
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
                    stroke={isSelected ? "#ffc96b" : "#ffffff"}
                    strokeWidth={isSelected ? 1.3 : 0.3}
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
            width: cssW,
            height: cssH,
            pan,
            zoom,
            viewBox,
            currentViewBox,
            visibleBetweenRegionFlows,
            selectedRegionId,
            showFlows
        };
    }, [width, height, pan, zoom, viewBox, visibleBetweenRegionFlows, selectedRegionId, showFlows, currentViewBox, cssW, cssH]);

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

    useEffect(() => {
        // @ts-ignore
        globalThis.addEventListener("keydown", handleContainerKeyDown);

        // @ts-ignore
        return () => globalThis.removeEventListener("keydown", handleContainerKeyDown);
    }, [handleContainerKeyDown]);

    useEffect(() => {
        if (didAutoFitRef.current) {
            return;
        }
        if (!svgRef.current) {
            return;
        }
        if (!cssW || !cssH) {
            return;
        }
        // Не вмешиваемся, если пользователь уже подвигал/приблизил
        if (!(zoom === 1 && pan.x === 0 && pan.y === 0)) {
            return;
        }

        // Берём базовый слой без «пузырей»; если его нет — берём весь svg
        const layer = (svgRef.current.querySelector('g[data-layer="base"]') as SVGSVGElement | undefined) ?? svgRef.current;
        const bbox = layer.getBBox();
        if (!bbox.width || !bbox.height) {
            return;
        }

        const paddingY = bbox.height * 0.05; // 5% сверху и снизу
        const paddedBBox = {
            x: bbox.x,
            y: bbox.y - paddingY,
            width: bbox.width,
            height: bbox.height + paddingY * 2
        };
        const zoomToFitH = viewBox.height / paddedBBox.height;

        // Какой world-вьюпорт получится при таком зуме
        const worldW = viewBox.width / zoomToFitH;
        const worldH = viewBox.height / zoomToFitH;

        // Соотношение world-единиц к CSS-px
        const unitsPerPxX = worldW / cssW;
        const unitsPerPxY = worldH / cssH;

        // Центрируем bbox по X в этом world-вьюпорте
        const bboxCenterX = bbox.x + bbox.width / 2;

        // смещение центра по X в долях видимого world-вьюпорта
        // >0 — сдвиг карты влево (визуально центр уедет правее), <0 — вправо
        const centerBias = -0.15;
        const biasWorld = worldW * centerBias;

        // Хотим, чтобы наш currentViewBox по центру совпал с bboxCenter
        // (текущий viewBox «начинается» в (minX, minY), значит pan = смещение этой точки)
        setZoom(zoomToFitH);
        setPan({
            x: (bboxCenterX - worldW / 2 - viewBox.minX + biasWorld) / unitsPerPxX,
            y: (bbox.y - viewBox.minY) / unitsPerPxY
        });

        didAutoFitRef.current = true;
    }, [cssW, cssH, zoom, pan.x, pan.y, viewBox, setZoom, setPan]);

    useEffect(() => {
        if (!svgRef.current) {
            return;
        }
        for (const id of Object.keys(regions)) {
            const regionId = Number(id);
            if (!anchorsRef.current.has(regionId)) {
                const a = getRegionAnchor(regionId, svgRef.current);
                if (a) {
                    anchorsRef.current.set(regionId, a);
                }
            }
        }
    }, [getRegionAnchor, regions, svgPaths]);

    if (
        isAverageDurationByRegionsError ||
        isCountByRegionsError ||
        isFlightsBetweenRegionError ||
        isAverageCountByRegionsError ||
        isEmptyDaysByRegionsError ||
        isDensityByRegionsError ||
        isMaxCountByRegionsError
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
                    } else if (isMaxCountByRegionsError) {
                        refetchMaxCountByRegions();
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
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onContextMenu={(event) => event.preventDefault()}
        >
            {(isAverageDurationByRegionsLoading ||
                isAverageDurationByRegionsFetching ||
                isCountByRegionsLoading ||
                isCountByRegionsFetching ||
                isFlightsBetweenRegionLoading ||
                isAverageCountByRegionsLoading ||
                isAverageCountByRegionsFetching ||
                isEmptyDaysByRegionsLoading ||
                isEmptyDaysByRegionsFetching ||
                isDensityByRegionsLoading ||
                isDensityByRegionsFetching ||
                isMaxCountByRegionsLoading ||
                isMaxCountByRegionsFetching) && (
                <Dimmer active>
                    <Loader />
                </Dimmer>
            )}
            <svg
                ref={svgRef}
                width={cssW}
                height={cssH}
                viewBox={`${currentViewBox.minX} ${currentViewBox.minY} ${currentViewBox.width} ${currentViewBox.height}`}
                preserveAspectRatio="xMidYMid meet"
                className={styles.svg}
                role="img"
                aria-label="Карта регионов России"
                onContextMenu={(event) => event.preventDefault()}
                onClick={handleRegionClick}
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={handleSvgMouseLeave}
            >
                {svgPaths}
            </svg>

            <canvas ref={canvasRef} className={styles.canvas} />

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

            {!isAverageDurationByRegionsLoading &&
                !isCountByRegionsLoading &&
                !isFlightsBetweenRegionLoading &&
                !isAverageCountByRegionsLoading &&
                !isEmptyDaysByRegionsLoading &&
                !isDensityByRegionsLoading &&
                !isMaxCountByRegionsLoading && (
                    <Overlays
                        // Легенда всегда показывается
                        selectionActive={selectedRegionId !== null}
                        selectedRegionName={selectedRegionName}
                        selectedRegionStat={selectedRegionIntra}
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

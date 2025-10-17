import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Duration } from "luxon";
import { Dimmer, Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";
import LoadingErrorBlock from "@commonComponents/LoadingErrorBlock/LoadingErrorBlock";
import { useFilterForm } from "@components/Dashboard/context";
import { getTimeResolutionDescriptionFromEnum } from "@components/Dashboard/utils";
import FlowsCanvas from "@components/FlightsMap/FlowCanvas";
import MapSvg from "@components/FlightsMap/MapSvg";
import MapTooltip from "@components/FlightsMap/MapTooltip";
import Overlays from "@components/FlightsMap/Overlays";
import { useAutoFitOnce } from "@components/FlightsMap/utils/hooks/useAutoFitOnce";
import { useEscapeToResetSelection } from "@components/FlightsMap/utils/hooks/useEscapeToResetSelection";
import { usePanZoom } from "@components/FlightsMap/utils/hooks/usePanZoom";
import {
    computeVisualCenter,
    getCurrentViewBoxForPanZoom,
    haloOpacity,
    lerpColor,
    makeCurve,
    opacity,
    thicknessScreenPx
} from "@components/FlightsMap/utils/utils";
import { useElementSize } from "@hooks/useElementSize";
import { HeatmapMode } from "@models/analytics/enums";
import { FlightBetweenRegions } from "@models/analytics/types";
import { ViewBox } from "@models/map/types";
import { RegionShape } from "@models/regions/types";
import { useGetFlightsBetweenRegionQuery } from "@store/analytics/api";

import styles from "./styles/FlightsMap.module.scss";
import { useHeatmapData } from "./utils/hooks/useHeatmapData";

export interface FlightsMapProps {
    viewBox: ViewBox;
    regions: Record<number, RegionShape>;
    width: number;
    height: number;
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

export default function FlightsMap({ viewBox, regions, width, height }: FlightsMapProps) {
    const formData = useFilterForm();

    const {
        data: flightsBetweenRegion,
        isLoading: isFlightsBetweenRegionLoading,
        isError: isFlightsBetweenRegionError,
        refetch: refetchFlightsBetweenRegion
    } = useGetFlightsBetweenRegionQuery();

    // Собираем все данные для тепловой карты
    const {
        heatmapInfoByRegion,
        heatDomains,
        queriesState: { isLoadingAny: isHeatmapLoading, isFetchingAny: isHeatmapFetching, errorRefetch: heatmapErrorRefetch }
    } = useHeatmapData({ formData, regions, interregionalCounts: flightsBetweenRegion?.regionCounts });

    const topFly = flightsBetweenRegion?.topFly;
    const regionFlights = flightsBetweenRegion?.regionFlights;
    const topFlightsCount = flightsBetweenRegion?.count;

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const anchorsRef = useRef<Map<number, [number, number]>>(new Map());
    const curveCacheRef = useRef<
        Map<
            string,
            {
                curve: ReturnType<typeof makeCurve>;
                departure: [number, number];
                destination: [number, number];
            }
        >
    >(new Map());

    const measured = useElementSize<HTMLDivElement>(containerRef);
    const cssW = measured.width || width; // fallback на пропcы, если 0 в первый рендер
    const cssH = measured.height || height;

    const { zoom, pan, setZoom, setPan, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, consumeDragFlag, isDragging } =
        usePanZoom({
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

    useAutoFitOnce({
        svgRef,
        width: cssW,
        height: cssH,
        zoom,
        pan,
        viewBox,
        setZoom,
        setPan
    });

    const getHeatValue = useCallback(
        (regionId: number) => {
            const heatMapInfo = heatmapInfoByRegion.get(regionId);
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
                case HeatmapMode.BETWEEN_REGIONS_COUNT: {
                    const { min, max } = heatDomains[HeatmapMode.BETWEEN_REGIONS_COUNT];

                    if (max <= min) {
                        return 0;
                    }

                    return (heatMapInfo.interregionalFlightCount - min) / (max - min);
                }
                default: {
                    return 0;
                }
            }
        },
        [heatmapInfoByRegion, heatDomains, heatmapMode]
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
        () =>
            // Если регион не выбран — показываем топ перелётов, иначе связи конкретного региона
            selectedRegionId === null ? topFly || [] : regionFlights?.[selectedRegionId] || [],
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
            }
        },
        [consumeDragFlag, bringToFront]
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

            const cacheKey = `${flow.departureRegionId}-${flow.destinationRegionId}`;
            const cachedCurve = curveCacheRef.current.get(cacheKey);
            const departureAnchor: [number, number] = [a1[0], a1[1]];
            const destinationAnchor: [number, number] = [a2[0], a2[1]];

            let curve = cachedCurve?.curve;

            if (
                !curve ||
                cachedCurve?.departure[0] !== departureAnchor[0] ||
                cachedCurve?.departure[1] !== departureAnchor[1] ||
                cachedCurve?.destination[0] !== destinationAnchor[0] ||
                cachedCurve?.destination[1] !== destinationAnchor[1]
            ) {
                curve = makeCurve(departureAnchor, destinationAnchor, 12, 0.35);
                curveCacheRef.current.set(cacheKey, {
                    curve,
                    departure: departureAnchor,
                    destination: destinationAnchor
                });
            }

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

    const selectedRegionName = selectedRegionId === null ? undefined : regions[selectedRegionId]?.name || `Регион ${selectedRegionId}`;
    const selectedRegionStats =
        selectedRegionId === null
            ? undefined
            : heatmapInfoByRegion.get(selectedRegionId) || {
                  flightCount: 0,
                  averageFlightDurationSeconds: 0,
                  averageFlightCount: 0,
                  medianFlightCount: 0,
                  emptyDays: 0,
                  density: 0,
                  maxCount: 0,
                  interregionalFlightCount: 0
              };

    const selectedRegionInterregionalCount = selectedRegionId === null ? 0 : (selectedRegionStats?.interregionalFlightCount ?? 0);

    const getTooltipContent = useCallback(
        (regionId: number) => {
            const name = regions[regionId]?.name || `Регион ${regionId}`;

            const heatMapInfo = heatmapInfoByRegion.get(regionId);
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
                case HeatmapMode.BETWEEN_REGIONS_COUNT: {
                    content = `Перелетов в другие регионы: ${heatMapInfo.interregionalFlightCount}`;
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
        [formData.resolution, heatmapMode, heatmapInfoByRegion, regions]
    );

    const handleSvgMouseMove = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            if (isDragging) {
                setTooltip((prevTooltip) => {
                    if (!prevTooltip.visible) {
                        return prevTooltip;
                    }

                    return { ...prevTooltip, visible: false };
                });
                return;
            }

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
        [getTooltipContent, isDragging]
    );

    const handleSvgMouseLeave = useCallback(() => {
        setTooltip((_tooltip) => ({ ..._tooltip, visible: false }));
    }, []);

    useEscapeToResetSelection({ selectedRegionId, onReset: () => setSelectedRegionId(null) });

    useEffect(() => {
        if (!svgRef.current) {
            return;
        }

        for (const region of Object.values(regions)) {
            if (!anchorsRef.current.has(region.id)) {
                const anchor = getRegionAnchor(region.id, svgRef.current);
                if (anchor) {
                    anchorsRef.current.set(region.id, anchor);
                }
            }
        }
    }, [getRegionAnchor, regions]);

    useEffect(() => {
        curveCacheRef.current.clear();
    }, [regions]);

    const hasHeatmapError = Boolean(heatmapErrorRefetch);

    if (hasHeatmapError || isFlightsBetweenRegionError) {
        return (
            <LoadingErrorBlock
                isLoadingErrorObjectText="данных для карты"
                reload={() => {
                    if (heatmapErrorRefetch) {
                        heatmapErrorRefetch();
                        return;
                    }

                    if (isFlightsBetweenRegionError) {
                        refetchFlightsBetweenRegion();
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
            {(isHeatmapLoading || isHeatmapFetching || isFlightsBetweenRegionLoading) && (
                <Dimmer active>
                    <Loader />
                </Dimmer>
            )}
            <MapSvg
                ref={svgRef}
                width={cssW}
                height={cssH}
                currentViewBox={currentViewBox}
                regions={regions}
                selectedRegionId={selectedRegionId}
                heatColorForRegion={heatColorForRegion}
                onRegionClick={handleRegionClick}
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={handleSvgMouseLeave}
            />

            <FlowsCanvas
                width={cssW}
                height={cssH}
                currentViewBox={currentViewBox}
                flows={visibleBetweenRegionFlows}
                showFlows={showFlows}
                drawFlow={drawInterRegionFlow}
            />

            <MapTooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>
                {tooltip.text}
            </MapTooltip>

            {!isHeatmapLoading && !isHeatmapFetching && !isFlightsBetweenRegionLoading && (
                <Overlays
                    // Легенда всегда показывается
                    selectionActive={selectedRegionId !== null}
                    selectedRegionName={selectedRegionName}
                    selectedRegionStat={selectedRegionStats}
                    interregionalFlightsCount={selectedRegionInterregionalCount}
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

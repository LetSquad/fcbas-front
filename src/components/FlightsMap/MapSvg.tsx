import { ForwardedRef, forwardRef, memo, MouseEvent, ReactElement, useMemo } from "react";

import { ViewBox } from "@models/map/types";
import { RegionShape } from "@models/regions/types";

import styles from "./styles/MapSvg.module.scss";

interface MapSvgProps {
    width: number;
    height: number;
    currentViewBox: ViewBox;
    regions: Record<number, RegionShape>;
    selectedRegionId: number | null;
    heatColorForRegion: (regionId: number, isSelected: boolean) => string;
    onRegionClick: (event: MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (event: MouseEvent<SVGSVGElement>) => void;
    onMouseLeave: (event: MouseEvent<SVGSVGElement>) => void;
}

/**
 * SVG-обёртка над контурами регионов.
 */
function MapSvg(
    { width, height, currentViewBox, regions, selectedRegionId, heatColorForRegion, onRegionClick, onMouseMove, onMouseLeave }: MapSvgProps,
    ref: ForwardedRef<SVGSVGElement>
): ReactElement {
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
                    data-layer={region.isBubble ? "bubble" : "base"}
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
                {/* Слой обычных регионов рисуем первым */}
                <g data-layer="base">{baseRegions.map((element) => renderPath(element))}</g>

                {/* «Пузыри» (круги/эллипсы) должны быть поверх */}
                <g data-layer="bubble">{bubbleRegions.map((element) => renderPath(element))}</g>
            </>
        );
    }, [heatColorForRegion, regions, selectedRegionId]);

    return (
        <svg
            ref={ref}
            width={width}
            height={height}
            viewBox={`${currentViewBox.minX} ${currentViewBox.minY} ${currentViewBox.width} ${currentViewBox.height}`}
            preserveAspectRatio="xMidYMid meet"
            className={styles.svg}
            role="img"
            aria-label="Карта регионов России"
            onContextMenu={(event) => event.preventDefault()}
            onClick={onRegionClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
        >
            {svgPaths}
        </svg>
    );
}

export default memo(forwardRef(MapSvg));

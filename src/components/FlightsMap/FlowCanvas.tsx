import { memo, useEffect, useRef } from "react";

import { getMeetFromCurrentViewBox } from "@components/FlightsMap/utils/utils";
import { FlightBetweenRegions } from "@models/analytics/types";
import { ViewBox } from "@models/map/types";

import styles from "./styles/FlowCanvas.module.scss";

export type FlightFlow = Omit<FlightBetweenRegions, "count"> & { count?: number };

interface FlowsCanvasProps {
    width: number;
    height: number;
    currentViewBox: ViewBox;
    flows: FlightFlow[];
    showFlows: boolean;
    drawFlow: (flow: FlightFlow, context: CanvasRenderingContext2D, now: number, pixelsPerWorldX: number) => void;
}

/**
 * Canvas-слой с линиями перелётов.
 */
function FlowsCanvas({ width, height, currentViewBox, flows, showFlows, drawFlow }: FlowsCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const latestRef = useRef({ width, height, currentViewBox, flows, showFlows });

    useEffect(() => {
        latestRef.current = { width, height, currentViewBox, flows, showFlows };
    }, [width, height, currentViewBox, flows, showFlows]);

    useEffect(() => {
        const canvasElement = canvasRef.current;

        if (!canvasElement) {
            return;
        }

        const context = canvasElement.getContext("2d");

        if (!context) {
            return;
        }

        let isMounted = true;

        const drawFrame = (now: number) => {
            if (!isMounted) {
                return;
            }

            const {
                width: curWidth,
                height: curHeight,
                currentViewBox: curViewBox,
                flows: curFlows,
                showFlows: curShowFlows
            } = latestRef.current;

            const dpr = window.devicePixelRatio || 1;

            const { minX, minY, scaleScreenPerWorld, offsetXpx, offsetYpx, desiredWidth, desiredHeight } = getMeetFromCurrentViewBox(
                curViewBox,
                curWidth,
                curHeight,
                dpr
            );

            if (canvasElement.width !== desiredWidth || canvasElement.height !== desiredHeight) {
                canvasElement.width = desiredWidth;
                canvasElement.height = desiredHeight;
            }

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);

            context.setTransform(
                scaleScreenPerWorld,
                0,
                0,
                scaleScreenPerWorld,
                -minX * scaleScreenPerWorld + offsetXpx,
                -minY * scaleScreenPerWorld + offsetYpx
            );

            if (curShowFlows) {
                for (const flow of curFlows) {
                    drawFlow(flow, context, now, scaleScreenPerWorld);
                }
            }

            animationFrameRef.current = requestAnimationFrame(drawFrame);
        };

        animationFrameRef.current = requestAnimationFrame(drawFrame);

        return () => {
            isMounted = false;

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [drawFlow]);

    return <canvas ref={canvasRef} className={styles.canvas} />;
}

export default memo(FlowsCanvas);

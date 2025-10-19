import { PointerEvent as ReactPointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

interface UsePanZoomProps {
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    moveThresholdPx?: number;
    containerRef?: RefObject<HTMLDivElement | null>;
}

interface DragInternal {
    lastClientX: number;
    lastClientY: number;
}

interface DragState {
    isPointerDown: boolean;
    startX: number;
    startY: number;
    moved: boolean;
}

interface PanPosition {
    x: number;
    y: number;
}

type PanUpdater = PanPosition | ((prev: PanPosition) => PanPosition);

const PAN_SPEED = 1;

/**
 * Пан/зум для карты.
 *  - Пэн разрешён ЛЮБОЙ кнопкой мыши (левая/средняя/правая) и тач/перо.
 *  - Любое заметное движение во время зажатия (по умолчанию > 1px) помечает жест как drag,
 *    и следующий click будет проигнорирован потребителем (через consumeDragFlag()).
 *  - Завершение перетаскивание при pointerup/pointercancel/leave/blur.
 */
export function usePanZoom({ minZoom = 0.7, maxZoom = 8, zoomStep = 1.1, moveThresholdPx = 1, containerRef }: UsePanZoomProps = {}) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPanState] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const dragRef = useRef<DragInternal | null>(null);
    const dragStateRef = useRef<DragState>({ isPointerDown: false, startX: 0, startY: 0, moved: false });
    const justDraggedRef = useRef<boolean>(false);
    const panRef = useRef<PanPosition>(pan);
    const pointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
    const pinchStateRef = useRef<{ lastDistance: number } | null>(null);

    const resolvePanUpdater = useCallback(
        (update: PanUpdater, current: PanPosition): PanPosition =>
            typeof update === "function" ? (update as (prev: PanPosition) => PanPosition)(current) : update,
        []
    );

    const commitPanState = useCallback((next: PanPosition, options?: { flush?: boolean }) => {
        panRef.current = next;

        if (options?.flush) {
            flushSync(() => {
                setPanState(next);
            });
        } else {
            setPanState(next);
        }
    }, []);

    const setPan = useCallback(
        (update: PanUpdater) => {
            const next = resolvePanUpdater(update, panRef.current);

            commitPanState(next);
        },
        [commitPanState, resolvePanUpdater]
    );

    const stopDragging = useCallback(() => {
        dragRef.current = null;
        dragStateRef.current.isPointerDown = false;
        dragStateRef.current.moved = false;
        setIsDragging(false);

        setPanState(panRef.current);
        // ВАЖНО: justDraggedRef не меняется, чтобы следующий click мог его «съесть»
    }, []);

    const resetDragFromRemainingPointer = useCallback(() => {
        if (pointersRef.current.size !== 1) {
            return;
        }

        const remainingPointer = pointersRef.current.values().next().value;

        if (!remainingPointer) {
            return;
        }

        dragRef.current = {
            lastClientX: remainingPointer.clientX,
            lastClientY: remainingPointer.clientY
        };
        dragStateRef.current = {
            isPointerDown: true,
            startX: remainingPointer.clientX,
            startY: remainingPointer.clientY,
            moved: false
        };
        justDraggedRef.current = false;
    }, []);

    const finishPointerInteraction = useCallback(
        (pointerId: number) => {
            pointersRef.current.delete(pointerId);

            if (pointersRef.current.size < 2) {
                pinchStateRef.current = null;
            }

            stopDragging();

            resetDragFromRemainingPointer();
        },
        [resetDragFromRemainingPointer, stopDragging]
    );

    const onPointerDown = useCallback(
        (event: ReactPointerEvent) => {
            // Разрешены любые кнопки мыши и любые типы указателей
            dragRef.current = {
                lastClientX: event.clientX,
                lastClientY: event.clientY
            };

            const target = event.currentTarget as Element;
            if (event.pointerType !== "mouse" && target?.setPointerCapture) {
                target.setPointerCapture(event.pointerId);
            }

            dragStateRef.current.isPointerDown = true;
            dragStateRef.current.startX = event.clientX;
            dragStateRef.current.startY = event.clientY;
            dragStateRef.current.moved = false;
            justDraggedRef.current = false;
            setIsDragging(false);

            pointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

            if (pointersRef.current.size >= 2) {
                const [first, second] = [...pointersRef.current.values()];

                if (!first || !second) {
                    pinchStateRef.current = null;
                    return;
                }
                const dx = first.clientX - second.clientX;
                const dy = first.clientY - second.clientY;
                const distance = Math.hypot(dx, dy);

                pinchStateRef.current = distance > 0 ? { lastDistance: distance } : null;

                // Во время мульти-тача панорамирование мышью/одним пальцем временно отключаем
                dragRef.current = null;
                dragStateRef.current.isPointerDown = false;
            } else {
                pinchStateRef.current = null;
            }

            const { pointerId } = event;
            const up = () => finishPointerInteraction(pointerId);
            const cancel = () => finishPointerInteraction(pointerId);
            globalThis.addEventListener("pointerup", up, { once: true });
            globalThis.addEventListener("pointercancel", cancel, { once: true });
            globalThis.addEventListener("pointerup", up, { once: true });
            globalThis.addEventListener("pointercancel", cancel, { once: true });
        },
        [finishPointerInteraction]
    );

    // Вычисляем координаты курсора относительно контейнера
    const clientToLocal = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef?.current;

            if (!el) {
                return { x: clientX, y: clientY };
            } // fallback: window cords

            const rect = el.getBoundingClientRect();

            return { x: clientX - rect.left, y: clientY - rect.top };
        },
        [containerRef]
    );

    const zoomByFactorAtClient = useCallback(
        (factor: number, clientX: number, clientY: number) => {
            const localPoint = clientToLocal(clientX, clientY);

            setZoom((oldZoom) => {
                const newZoom = Math.min(maxZoom, Math.max(minZoom, oldZoom * factor));
                const s = newZoom / oldZoom;

                setPan((oldPan) => {
                    const newPanX = oldPan.x + (1 - s) * (localPoint.x - oldPan.x);
                    const newPanY = oldPan.y + (1 - s) * (localPoint.y - oldPan.y);

                    return { x: newPanX, y: newPanY };
                });

                return newZoom;
            });
        },
        [clientToLocal, minZoom, maxZoom, setPan]
    );

    const onPointerMove = useCallback(
        (event: ReactPointerEvent) => {
            event.preventDefault();

            if (pointersRef.current.has(event.pointerId)) {
                pointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
            }

            if (pointersRef.current.size >= 2) {
                const [first, second] = [...pointersRef.current.values()];

                if (!first || !second) {
                    pinchStateRef.current = null;
                    return;
                }

                const dx = first.clientX - second.clientX;
                const dy = first.clientY - second.clientY;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    if (pinchStateRef.current) {
                        const { lastDistance } = pinchStateRef.current;

                        if (lastDistance > 0) {
                            const factor = distance / lastDistance;

                            if (factor !== 1) {
                                const centerX = (first.clientX + second.clientX) / 2;
                                const centerY = (first.clientY + second.clientY) / 2;

                                zoomByFactorAtClient(factor, centerX, centerY);
                            }
                        }

                        pinchStateRef.current.lastDistance = distance;
                    } else {
                        pinchStateRef.current = { lastDistance: distance };
                    }
                }

                return;
            }

            if (!dragRef.current) {
                return;
            }

            const { nativeEvent } = event;
            const coalesced = typeof nativeEvent.getCoalescedEvents === "function" ? nativeEvent.getCoalescedEvents() : null;

            let totalDeltaX = 0;
            let totalDeltaY = 0;
            let latestClientX = dragRef.current.lastClientX;
            let latestClientY = dragRef.current.lastClientY;

            if (coalesced && coalesced.length > 0) {
                for (const pointerEvent of coalesced) {
                    totalDeltaX += pointerEvent.clientX - latestClientX;
                    totalDeltaY += pointerEvent.clientY - latestClientY;
                    latestClientX = pointerEvent.clientX;
                    latestClientY = pointerEvent.clientY;
                }
            } else {
                totalDeltaX = event.clientX - latestClientX;
                totalDeltaY = event.clientY - latestClientY;
                latestClientX = event.clientX;
                latestClientY = event.clientY;
            }

            if (!dragStateRef.current.moved) {
                const totalDxFromStart = latestClientX - dragStateRef.current.startX;
                const totalDyFromStart = latestClientY - dragStateRef.current.startY;

                if (Math.abs(totalDxFromStart) > moveThresholdPx || Math.abs(totalDyFromStart) > moveThresholdPx) {
                    dragStateRef.current.moved = true;
                    justDraggedRef.current = true;
                    setIsDragging(true);
                }
            }

            if (totalDeltaX === 0 && totalDeltaY === 0) {
                return;
            }

            const nextPan = {
                x: panRef.current.x + totalDeltaX * PAN_SPEED,
                y: panRef.current.y + totalDeltaY * PAN_SPEED
            };

            dragRef.current.lastClientX = latestClientX;
            dragRef.current.lastClientY = latestClientY;

            commitPanState(nextPan, { flush: true });
        },
        [commitPanState, moveThresholdPx, zoomByFactorAtClient]
    );

    const onPointerUp = useCallback(
        (event: ReactPointerEvent) => {
            const target = event.currentTarget as Element;
            if (target?.releasePointerCapture && target.hasPointerCapture?.(event.pointerId)) {
                target.releasePointerCapture(event.pointerId);
            }

            finishPointerInteraction(event.pointerId);
        },
        [finishPointerInteraction]
    );

    const onPointerLeave = useCallback(
        (event: ReactPointerEvent) => {
            const target = event.currentTarget as Element;

            if (target?.hasPointerCapture?.(event.pointerId)) {
                return;
            }

            if (pointersRef.current.has(event.pointerId) || dragRef.current) {
                finishPointerInteraction(event.pointerId);
            }
        },
        [finishPointerInteraction]
    );

    const onWheel = useCallback(
        (event: WheelEvent) => {
            event.preventDefault();
            const direction = event.deltaY > 0 ? 1 : -1;
            const factor = direction > 0 ? 1 / zoomStep : zoomStep;

            // используем корректную функцию, которая изменит zoom и pan одновременно
            zoomByFactorAtClient(factor, event.clientX, event.clientY);
        },
        [zoomStep, zoomByFactorAtClient]
    );

    // Прикрепляем нативный wheel к containerRef или к элементу по умолчанию (window)
    useEffect(() => {
        const element = containerRef?.current ?? globalThis;

        if (!element) {
            return;
        }

        element.addEventListener("wheel", onWheel as EventListener, { passive: false });

        return () => {
            element.removeEventListener("wheel", onWheel as EventListener);
        };
    }, [containerRef, onWheel]);

    // Если окно потеряло фокус во время драга — безопасно завершаем
    useEffect(() => {
        const onBlur = () => stopDragging();
        window.addEventListener("blur", onBlur);

        return () => window.removeEventListener("blur", onBlur);
    }, [stopDragging]);

    // Defensive: cleanup on unmount
    useEffect(() => stopDragging, [stopDragging]);

    const consumeDragFlag = useCallback(() => {
        const was = justDraggedRef.current;
        justDraggedRef.current = false;

        return was;
    }, []);

    return {
        zoom,
        pan,
        setZoom,
        setPan,
        onWheel,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerLeave,
        consumeDragFlag,
        isDragging
    };
}

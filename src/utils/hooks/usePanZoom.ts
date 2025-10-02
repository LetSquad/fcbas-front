import { PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

interface UsePanZoomProps {
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    moveThresholdPx?: number;
    containerRef?: RefObject<HTMLDivElement | null>;
}

interface DragInternal {
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
}

interface DragState {
    isPointerDown: boolean;
    startX: number;
    startY: number;
    moved: boolean;
}

/**
 * Пан/зум для карты.
 * ВАЖНО:
 *  - Пэн разрешён ЛЮБОЙ кнопкой мыши (левая/средняя/правая) и тач/перо.
 *  - Любое заметное движение во время зажатия (по умолчанию > 1px) помечает жест как drag,
 *    и следующий click будет проигнорирован потребителем (через consumeDragFlag()).
 *  - Грациозно завершаем перетаскивание при pointerup/pointercancel/leave/blur.
 */
export function usePanZoom({ minZoom = 0.7, maxZoom = 8, zoomStep = 1.1, moveThresholdPx = 1, containerRef }: UsePanZoomProps = {}) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const dragRef = useRef<DragInternal | null>(null);
    const dragStateRef = useRef<DragState>({ isPointerDown: false, startX: 0, startY: 0, moved: false });
    const justDraggedRef = useRef<boolean>(false);

    const stopDragging = useCallback(() => {
        dragRef.current = null;
        dragStateRef.current.isPointerDown = false;
        dragStateRef.current.moved = false;
        // ВАЖНО: justDraggedRef не трогаем — чтобы следующий click мог его «съесть»
    }, []);

    const onPointerDown = useCallback(
        (event: PointerEvent) => {
            // Разрешаем любую кнопку мыши и любые типы указателей
            dragRef.current = {
                startClientX: event.clientX,
                startClientY: event.clientY,
                startPanX: pan.x,
                startPanY: pan.y
            };
            dragStateRef.current.isPointerDown = true;
            dragStateRef.current.startX = event.clientX;
            dragStateRef.current.startY = event.clientY;
            dragStateRef.current.moved = false;
            justDraggedRef.current = false;

            const up = () => stopDragging();
            const cancel = () => stopDragging();
            globalThis.addEventListener("pointerup", up, { once: true });
            globalThis.addEventListener("pointercancel", cancel, { once: true });
        },
        [pan.x, pan.y, stopDragging]
    );

    const onPointerMove = useCallback(
        (event: PointerEvent) => {
            if (!dragRef.current) {
                return;
            }
            const dx = event.clientX - dragRef.current.startClientX;
            const dy = event.clientY - dragRef.current.startClientY;

            if (!dragStateRef.current.moved && (Math.abs(dx) > moveThresholdPx || Math.abs(dy) > moveThresholdPx)) {
                dragStateRef.current.moved = true;
                justDraggedRef.current = true;
            }
            setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
        },
        [moveThresholdPx]
    );

    const onPointerUp = useCallback(() => {
        stopDragging();
    }, [stopDragging]);

    const onPointerLeave = useCallback(() => {
        if (dragRef.current) {
            stopDragging();
        }
    }, [stopDragging]);

    // Вспомогательная функция: вычислить координаты курсора относ. контейнера
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
        [clientToLocal, minZoom, maxZoom]
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
        const el = containerRef?.current ?? globalThis;
        el.addEventListener("wheel", onWheel as EventListener, { passive: false });

        return () => {
            el.removeEventListener("wheel", onWheel as EventListener);
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
        consumeDragFlag
    };
}

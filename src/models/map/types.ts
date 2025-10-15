export type Point = [number, number];
export type MinMaxPoint = [number, number, number, number];

export interface ViewBox {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

export interface HeatmapDomain {
    min: number;
    max: number;
}

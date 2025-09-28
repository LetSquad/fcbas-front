import { MinMaxPoint, Point } from "@models/map/types";

export interface Region {
    id: number;
    code: string;
    name: string;
    timezone?: string | null;
}

export interface RegionShape {
    code: string;
    id: number;
    name: string;
    isBubble: boolean;
    pathD: string; // SVG path 'd' for the region
    centroid: Point; // in SVG viewBox coordinates
    bbox: MinMaxPoint; // [minX, minY, maxX, maxY]
}

export interface RegionsResponse {
    regions: Region[];
}

export type RegionRecords = Record<number, Region>;

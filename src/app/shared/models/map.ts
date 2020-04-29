import { Tile } from './tile';
import { AreaEffect } from './area-effect';

export class Map {
    id: string;
    gridVisible: boolean;
    gridColor: string;
    gridSize: number;
    gridOffsetX: number;
    gridOffsetY: number;
    image: string;
    canvas: string;
    lineOfSight: boolean;
    fogVisible: boolean;
    fog: string;
    scale: number;
    x: number;
    y: number;
    zoom: number;

    tiles: Array<Tile> = [];
    areaEffects: Array<AreaEffect> = [];
}

import { Tile } from './tile';
import { AreaEffect } from './area-effect';
import { Drawing } from './drawing';
import { Wall } from './wall';
import { Marker } from './marker';

export enum MapLayer {
    token = "token",
    object = "object",
    map = "map",
    dm = "dm",
    wall = "wall",
    floor = "floor"
}

export class Map {
    id: string;
    gridVisible: boolean;
    gridColor: string;
    gridSize: number;
    gridOffsetX: number;
    gridOffsetY: number;
    image: string;
    video: string;
    canvas: string;
    lineOfSight: boolean;
    fogVisible: boolean;
    daylight: number;
    dayLight: number; // TYPO, will be removed in next version
    fog: string;
    scale: number;
    x: number;
    y: number;
    zoom: number;
    width: number;
    height: number;
    tiles: Array<Tile> = [];
    areaEffects: Array<AreaEffect> = [];
    markers: Array<Marker> = [];
    drawings: Array<Drawing> = [];
    walls: Array<Wall> = [];
}
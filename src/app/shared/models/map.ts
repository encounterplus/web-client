import { Tile } from './tile';
import { AreaEffect } from './area-effect';
import { Drawing } from './drawing';
import { Wall } from './wall';
import { Marker } from './marker';
import { Token } from './token';
import { Light } from './light';

export enum MapLayer {
    token = "token",
    object = "object",
    map = "map",
    dm = "dm",
    wall = "wall",
    floor = "floor"
}

export enum GridType {
    square = "square",
    hexFlat = "hexFlat",
    hexPointy = "hexPointy"
}

export enum GridStyle {
    solid = "solid",
    corners = "corners"
}

export enum WeatherType {
    none = "none",
    snow = "snow",
    rain = "rain",
    fog = "fog",
}

export class Map {
    id: string
    name: string
    slug: string
    gridVisible: boolean
    gridColor: string
    gridSize: number
    gridOffsetX: number
    gridOffsetY: number
    gridScale: number
    gridUnits: string
    gridType: GridType
    gridStyle: GridStyle
    gridOpacity: number
    image: string
    video: string
    scale: number
    lineOfSight: boolean
    daylight: number
    fogOfWar: boolean
    fogExplore: boolean
    fog: string
    weatherType: WeatherType
    weatherIntensity: number
    x: number
    y: number
    zoom: number
    width: number
    height: number
    tiles: Array<Tile> = []
    tokens: Array<Token> = []
    areaEffects: Array<AreaEffect> = []
    markers: Array<Marker> = []
    drawings: Array<Drawing> = []
    walls: Array<Wall> = []
    lights: Array<Light> = []
}
import { Light } from './light';
import { Vision } from './vision';
import { Asset } from './asset';
import { Component } from './component';
import { MapLayer } from './map';

export class Tile {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    layer: MapLayer = MapLayer.object;
    zIndex: null
    opacity: number;
    scale: number;
    asset?: Asset;
    light?: Light;
    components: Array<Component> = [];
    hidden: boolean = false;
}
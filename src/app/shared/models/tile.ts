import { Light } from './light';
import { Vision } from './vision';
import { Asset } from './asset';
import { MapLayer } from './map';

export interface Tile {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    layer: MapLayer;
    zIndex: number;
    opacity: number;
    scale: number;
    asset?: Asset;
    light?: Light;
    hidden?: boolean;
}
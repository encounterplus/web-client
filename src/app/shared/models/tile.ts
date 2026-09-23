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
    layer?: MapLayer;
    zIndex: number;
    opacity: number;
    scale: number;
    asset?: Asset;
    light?: Light;
    hidden: boolean;
}

/** The layer a tile sits on; the object layer when the app leaves it out. */
export function tileLayer(tile: Tile): MapLayer {
    return tile.layer ?? MapLayer.object
}

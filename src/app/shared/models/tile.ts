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
    zIndex: null
    opacity: number;
    scale: number;
    asset?: Asset;
    light?: Light;
    hidden: boolean;
}

/** The fields a `tileUpdated` event may leave out. */
export function tileDefaults(): Pick<Tile, "layer" | "hidden"> {
    return { layer: MapLayer.object, hidden: false }
}
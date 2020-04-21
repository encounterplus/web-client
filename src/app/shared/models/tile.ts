import { Light } from './light';
import { Vision } from './vision';
import { Asset } from './asset';

export class Tile {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: string;
    zIndex: null
    asset: Asset;
    light: Light;
    vision: Vision;
}
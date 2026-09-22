import { Asset } from './asset';

export enum AreaEffectShape {
    cone = "cone",
    cube = "cube",
    cylinder = "cylinder",
    line = "line",
    square = "square",
    sphere = "sphere"
}

export class AreaEffect {
    id: string;
    shape: AreaEffectShape;
    color: string;
    x: number;
    y: number;
    zIndex: number;
    opacity: number;
    angle: number;
    radius: number;
    length: number;
    width: number;
    asset: Asset;
    hidden: boolean = false;
}
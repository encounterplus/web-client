import { MapLayer } from './map';

export enum DrawingShape {
    polygon = "polygon",
    ellipse = "ellipse",
    rectangle = "rectangle"
}

export class Drawing {
    id: string;
    shape: DrawingShape = DrawingShape.polygon;
    data: Array<number> = [];
    layer: MapLayer;
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
    opacity: number;
}
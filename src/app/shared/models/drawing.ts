import { MapLayer } from './map';

export enum DrawingShape {
    polygon = "polygon",
    ellipse = "ellipse",
    rectangle = "rectangle"
}

export interface Drawing {
    id: string;
    shape?: DrawingShape;
    data: Array<number>;
    layer?: MapLayer;
    strokeWidth?: number;
    strokeColor?: string;
    fillColor?: string;
    opacity?: number;
}
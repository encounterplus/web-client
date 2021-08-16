import { MapLayer } from './map';

export enum MeasurementType {
    grid = "grid",
    precise = "precise"
}

export class Measurement {
    id: string
    type: MeasurementType = MeasurementType.grid
    color: string
    hidden: boolean
    data: Array<number> = [];
}
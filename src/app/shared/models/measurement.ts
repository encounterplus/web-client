import { MapLayer } from './map';

export enum MeasurementType {
    grid = "grid",
    precise = "precise"
}

export interface Measurement {
    id: string
    /** How the distance is measured; `precise` when the app leaves it out. */
    type?: MeasurementType
    color: string
    hidden: boolean
    data: Array<number>;
}
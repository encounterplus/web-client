import { MapLayer } from './map';

export enum MeasurementType {
    grid = "grid",
    precise = "precise"
}

export interface Measurement {
    id: string
    type: MeasurementType
    color: string
    hidden: boolean
    data: Array<number>;
}

/** The fields a `measurementUpdated` event may leave out. */
export function measurementDefaults(): Pick<Measurement, "type" | "data"> {
    return { type: MeasurementType.grid, data: [] }
}
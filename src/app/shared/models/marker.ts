export interface Marker {
    id: string;
    x: number;
    y: number;
    name: string;
    color: string;
    size: string;
    label: string;
    shape: string;
    hidden: boolean;
}

/** The fields a `markerUpdated` event may leave out. */
export function markerDefaults(): Pick<Marker, "hidden"> {
    return { hidden: false }
}
export interface Marker {
    id: string;
    x: number;
    y: number;
    name?: string;
    color: string;
    size: string;
    label?: string;
    shape: string;
    /** Hidden unless the app says otherwise: a marker with no `hidden` field is not drawn. */
    hidden?: boolean;
}

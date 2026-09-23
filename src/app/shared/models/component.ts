/** What a `Component` does to its artwork, as the app's `Component.ComponentType` raw values. */
export type ComponentType =
    | "filter.hsb"
    | "filter.tint"
    | "animation.rotation"
    | "animation.opacity"
    | "animation.scale"

/**
 * A filter or animation applied to an asset's artwork, as sent by the app.
 *
 * The app encodes only the keys a component has set, so every parameter is optional. Rendered by
 * `AssetArtwork`; `asset-components.ts` reads the parameters with the app's defaults.
 */
export interface Component {
    type: ComponentType | string;
    enabled: boolean;

    // filter.hsb — hue in degrees, saturation and brightness in percent
    hue?: number;
    saturation?: number;
    brightness?: number;

    // filter.tint
    color?: string;

    // animation.* — Core Animation's `fromValue`, `toValue`, `duration` (seconds), `repeatCount`
    // and `autoreverses`
    from?: number;
    to?: number;
    duration?: number;
    repeat?: number;
    autoreverse?: boolean;
}

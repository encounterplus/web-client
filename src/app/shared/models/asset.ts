import { Component } from "./component"

export type AlphaLayout = "horizontal" | "vertical"

/** A rectangle in unit coordinates of a video frame: x, y, width, height. */
export type UnitRect = [number, number, number, number]

export interface Asset {
    id: string
    name?: string
    type: string
    resource?: string
    parameters?: AssetParameters
    components?: Array<Component>
}

/** An asset known to have a resource — see `AssetVideo.isVideo`. */
export type VideoAsset = Asset & { resource: string }

/**
 * Type-specific parameters of an asset, as sent by the app.
 *
 * The app leaves out any video key that equals its default, so read those through `AssetVideo`
 * rather than directly.
 */
export interface AssetParameters {
    size?: string
    scale?: number
    offsetX?: number
    offsetY?: number
    frameWidth?: number
    frameHeight?: number
    duration?: number

    // video
    alpha?: boolean
    alphaLayout?: AlphaLayout
    loop?: boolean
    muted?: boolean
    speed?: number

    [key: string]: any
}

/**
 * Reads the placement parameters of an asset — how its artwork sits in the frame of the object
 * showing it — with the same defaults as the app's `AssetForm`.
 *
 * Shared by every map object that draws an asset, so tokens, tiles, auras and area effects agree.
 */
export class AssetLayout {

    /** The multiplier on the artwork's fitted size; 1 when unset or not a positive number. */
    static scale(asset: Asset | null | undefined): number {
        const scale = asset?.parameters?.scale
        if (typeof scale != "number" || !isFinite(scale) || scale <= 0) {
            return 1
        }
        return scale
    }

    /**
     * How far the artwork is shifted, in percent of its own drawn size.
     *
     * Added to the artwork's anchor as `offset / 100`, so a positive `x` moves the artwork left of
     * the object's point.
     */
    static offset(asset: Asset | null | undefined): { x: number, y: number } {
        const value = (key: "offsetX" | "offsetY") => {
            const offset = asset?.parameters?.[key]
            return typeof offset == "number" && isFinite(offset) ? offset : 0
        }
        return { x: value("offsetX"), y: value("offsetY") }
    }
}

/**
 * Reads the video parameters of an asset, with the same defaults as the app's `Asset` model.
 *
 * A split-alpha video carries its alpha channel in half of every frame: colour first (left or
 * top), a greyscale mask second. It is the only transparent video format the client handles — it
 * decodes the same in every browser, unlike WebM or HEVC alpha.
 *
 * Assets arrive as plain JSON, so these are static functions rather than methods on `Asset`.
 */
export class AssetVideo {

    static readonly speedRange: [number, number] = [0.1, 4.0]

    static isVideo(asset: Asset | null | undefined): asset is VideoAsset {
        return asset?.type == "video" && asset.resource != null
    }

    static isSplitAlpha(asset: Asset): boolean {
        return asset.type == "video" && asset.parameters?.alpha === true
    }

    static layout(asset: Asset): AlphaLayout {
        return asset.parameters?.alphaLayout == "vertical" ? "vertical" : "horizontal"
    }

    static loops(asset: Asset): boolean {
        return asset.parameters?.loop ?? true
    }

    static muted(asset: Asset): boolean {
        return asset.parameters?.muted ?? true
    }

    static speed(asset: Asset): number {
        const speed = asset.parameters?.speed
        if (typeof speed != "number" || !isFinite(speed)) {
            return 1
        }
        return Math.min(Math.max(speed, AssetVideo.speedRange[0]), AssetVideo.speedRange[1])
    }

    /** The part of the frame holding the picture; the whole frame for an opaque video. */
    static colorRect(asset: Asset): UnitRect {
        if (!AssetVideo.isSplitAlpha(asset)) {
            return [0, 0, 1, 1]
        }
        return AssetVideo.layout(asset) == "vertical" ? [0, 0, 1, 0.5] : [0, 0, 0.5, 1]
    }

    /** The part of the frame holding the alpha mask, or `null` for an opaque video. */
    static alphaRect(asset: Asset): UnitRect | null {
        if (!AssetVideo.isSplitAlpha(asset)) {
            return null
        }
        return AssetVideo.layout(asset) == "vertical" ? [0, 0.5, 1, 0.5] : [0.5, 0, 0.5, 1]
    }
}

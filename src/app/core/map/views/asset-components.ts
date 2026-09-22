import * as PIXI from 'pixi.js'
import { Component } from 'src/app/shared/models/component';
import { Utils } from 'src/app/shared/utils';

/**
 * The filter and animation components of an asset, read the way the app's `Component` reads them.
 *
 * Pure functions over the component list — no scene graph — so they are testable on their own.
 * `AssetArtwork` applies the results.
 */

/** A 5×4 colour matrix, row-major, as `PIXI.ColorMatrixFilter.matrix`. */
export type ColorMatrix = number[]

/** The animated property of an `animation.*` component. */
export type AnimationProperty = "rotation" | "scale" | "opacity"

/** The components that apply: the app defaults `enabled` to true. */
export function enabledComponents(components: Array<Component> | null | undefined): Array<Component> {
    return (components ?? []).filter(component => component != null && component.enabled !== false)
}

// MARK: - Animations

/** The property an animation component drives, or `null` for a filter or an unknown type. */
export function animationProperty(component: Component): AnimationProperty | null {
    switch (component.type) {
        case "animation.rotation": return "rotation"
        case "animation.scale": return "scale"
        case "animation.opacity": return "opacity"
        default: return null
    }
}

/**
 * The value of an animation at a point in its run, or `null` once it has finished.
 *
 * Mirrors the app's `CABasicAnimation`: linear from `from` to `to` over `duration` seconds
 * (default 1). With `autoreverse` it plays back again, and one repeat is the whole round trip.
 * It repeats `repeat` times — forever when unset; Core Animation plays a count of 0 once — and a
 * finished animation is removed, which puts the property back to its neutral value.
 *
 * Computed from elapsed time rather than stepped per frame, so it keeps its pace at any frame
 * rate. Rotation is in radians and scale a factor, as in the app.
 *
 * @param elapsed Milliseconds since the animation started.
 */
export function sampleAnimation(component: Component, elapsed: number): number | null {
    const duration = positive(component.duration) ?? 1
    const from = finite(component.from) ?? 0
    const to = finite(component.to) ?? 0

    const repeat = finite(component.repeat)
    const repeats = repeat == null ? Infinity : Math.max(repeat, 1)

    const cycle = component.autoreverse ? duration * 2 : duration
    const time = Math.max(elapsed, 0) / 1000
    if (time >= cycle * repeats) {
        return null
    }

    // 0…1 forward, then 1…2 on the way back
    const phase = (time % cycle) / duration
    const progress = phase <= 1 ? phase : 2 - phase
    return from + (to - from) * progress
}

// MARK: - Filters

/**
 * What the filter components do to the artwork: a tint and at most one colour matrix filter.
 *
 * Tint-only artwork keeps the free `tint` and no filter pass. Once an `filter.hsb` is present, every
 * filter — tints included — is folded into one colour matrix in component order, as the app chains
 * them, and `tint` is white.
 */
export interface ComponentFilters {
    tint: PIXI.ColorSource
    matrix: ColorMatrix | null
}

export function componentFilters(components: Array<Component>): ComponentFilters {
    const filters = components.filter(component => component.type == "filter.hsb" || component.type == "filter.tint")

    if (!filters.some(component => component.type == "filter.hsb")) {
        const tint = new PIXI.Color(0xffffff)
        filters.forEach(component => tint.multiply(tintColor(component)))
        return { tint: tint.toNumber(), matrix: null }
    }

    let matrix: ColorMatrix | null = null
    for (const component of filters) {
        const next = component.type == "filter.hsb" ? hsbMatrix(component) : tintMatrix(component)
        if (next != null) {
            matrix = matrix == null ? next : concatColorMatrices(matrix, next)
        }
    }
    return { tint: 0xffffff, matrix }
}

/**
 * The colour matrix of a `filter.hsb` component: hue, then saturation, then brightness.
 *
 * @returns `null` when all three are zero, which changes nothing.
 */
export function hsbMatrix(component: Component): ColorMatrix | null {
    const hue = finite(component.hue) ?? 0
    const saturation = finite(component.saturation) ?? 0
    const brightness = finite(component.brightness) ?? 0
    if (hue == 0 && saturation == 0 && brightness == 0) {
        return null
    }

    // pixi builds the hue and saturation matrices; reading them back keeps its formulas in one place
    const scratch = new PIXI.ColorMatrixFilter()
    scratch.hue(hue, false)
    const hueMatrix = [...scratch.matrix]
    scratch.saturate(saturation / 100, false)
    const saturationMatrix = [...scratch.matrix]
    scratch.destroy()

    const brightnessMatrix = [...Utils.brightnessMatrix(brightness / 100)]
    return concatColorMatrices(concatColorMatrices(hueMatrix, saturationMatrix), brightnessMatrix)
}

/** The colour matrix of a `filter.tint` component: a multiply, as the app's `CIMultiplyCompositing`. */
export function tintMatrix(component: Component): ColorMatrix {
    const [r, g, b] = new PIXI.Color(tintColor(component)).toArray()
    return [
        r, 0, 0, 0, 0,
        0, g, 0, 0, 0,
        0, 0, b, 0, 0,
        0, 0, 0, 1, 0,
    ]
}

/**
 * The colour matrix that applies `first`, then `second`.
 *
 * `PIXI.ColorMatrixFilter`'s own `multiply` flag composes the other way round — the matrix passed
 * in runs first — so chaining is done here, where the order reads as written.
 */
export function concatColorMatrices(first: ColorMatrix, second: ColorMatrix): ColorMatrix {
    const out = new Array<number>(20)
    for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 5; column++) {
            let value = 0
            for (let k = 0; k < 4; k++) {
                value += second[row * 5 + k] * first[k * 5 + column]
            }
            // the offset column carries through the implicit fifth row (0, 0, 0, 0, 1)
            out[row * 5 + column] = column == 4 ? value + second[row * 5 + 4] : value
        }
    }
    return out
}

/** The app falls back to red for a tint without a colour. */
function tintColor(component: Component): PIXI.ColorSource {
    try {
        return new PIXI.Color(component.color ?? "#FF0000")
    } catch {
        return 0xffffff
    }
}

function finite(value: unknown): number | null {
    return typeof value == "number" && isFinite(value) ? value : null
}

function positive(value: unknown): number | null {
    const number = finite(value)
    return number != null && number > 0 ? number : null
}

import * as PIXI from 'pixi.js'
import { Asset, AssetLayout } from 'src/app/shared/models/asset';
import { Component } from 'src/app/shared/models/component';
import { Utils } from 'src/app/shared/utils';
import { AssetSprite, assetSpriteSize, loadAssetSprite } from './asset-sprite';
import { AnimationProperty, animationProperty, componentFilters, enabledComponents, sampleAnimation } from './asset-components';

/**
 * Where a view wants an asset's artwork: the frame of the object showing it.
 *
 * The frame describes the object alone. `resolveLayout` adds the asset's own placement parameters
 * — scale and offset — on top, so no view reads them.
 */
export interface ArtworkFrame {
    width: number
    height: number

    /** The point of the artwork placed at the artwork's position, in unit coordinates. Default centre. */
    anchor?: { x: number, y: number }

    /** `stretch` fills the frame exactly; `aspectFit` keeps the artwork's proportions inside it. Default `stretch`. */
    fit?: "stretch" | "aspectFit"

    /** The object's own scale, such as a tile's; multiplied with the asset's. Default 1. */
    scale?: number
}

/** The artwork's drawn size and anchor, once the asset's parameters are applied. */
export interface ResolvedLayout {
    width: number
    height: number
    anchor: { x: number, y: number }
}

/**
 * Fits artwork of a natural size into a frame and applies the asset's scale and offset.
 *
 * The offset shifts the anchor by a percentage of the artwork's own size, as `TokenView` does, so
 * the object's point stays the pivot of rotation and scale animations.
 */
export function resolveLayout(frame: ArtworkFrame, natural: { width: number, height: number }, asset: Asset | null | undefined): ResolvedLayout {
    let width = frame.width
    let height = frame.height
    if (frame.fit == "aspectFit" && natural.width > 0 && natural.height > 0) {
        const fit = Utils.fitScaleFactor(natural.width, natural.height, frame.width, frame.height)
        width = natural.width * fit
        height = natural.height * fit
    }

    const objectScale = typeof frame.scale == "number" && isFinite(frame.scale) && frame.scale > 0 ? frame.scale : 1
    const scale = objectScale * AssetLayout.scale(asset)

    const anchor = frame.anchor ?? { x: 0.5, y: 0.5 }
    const offset = AssetLayout.offset(asset)

    return {
        width: width * scale,
        height: height * scale,
        anchor: { x: anchor.x + offset.x / 100, y: anchor.y + offset.y / 100 },
    }
}

/**
 * An asset drawn on the map with everything the asset asks for: its artwork, its placement
 * parameters, and its filter and animation components.
 *
 * Views place it like any container — position, rotation, alpha — and describe their frame through
 * `layout(_:)`. The components apply beneath that, so an animation adds to the object's own
 * rotation and multiplies its scale and opacity instead of replacing them:
 *
 * - the artwork itself: the view's transform
 * - `motion`: the component animations, around the artwork's origin
 * - the sprite: anchored and sized by `resolveLayout`, with the filters
 *
 * Loads by itself from construction. `destroy()` stops the animations, releases a video's shared
 * decoder, and discards a load still in flight — a view need not track superseded draws.
 */
export class AssetArtwork extends PIXI.Container {

    readonly asset: Asset

    /** Settles once loading is done: `true` when artwork is drawn, `false` when there is none or it failed. */
    readonly loaded: Promise<boolean>

    /** The loaded artwork, or `null` before it loads, when there is none, or once destroyed. */
    get sprite(): AssetSprite | null {
        return this._sprite
    }

    private _sprite: AssetSprite | null = null
    private readonly motion = new PIXI.Container()
    private frame: ArtworkFrame | null = null

    private filter: PIXI.ColorMatrixFilter | null = null
    private animations: Array<{ component: Component, property: AnimationProperty }> = []
    private elapsed = 0
    private ticking = false

    constructor(asset: Asset) {
        super()
        this.asset = asset
        this.addChild(this.motion)
        this.loaded = this.load()
    }

    /** Sets the frame the artwork is fitted to. Safe to call before loading finishes, and again later. */
    layout(frame: ArtworkFrame) {
        this.frame = frame
        this.applyLayout()
    }

    override destroy(options?: PIXI.DestroyOptions) {
        this.stopTicking()
        this.animations = []

        this.filter?.destroy()
        this.filter = null

        // stops a sprite sheet's ticker, and gives a video's shared decoder back
        this._sprite?.destroy()
        this._sprite = null
        this.motion.destroy()

        super.destroy(options)
    }

    private async load(): Promise<boolean> {
        let sprite: AssetSprite | null
        try {
            sprite = await loadAssetSprite(this.asset)
        } catch (error) {
            console.warn(`failed to load asset: ${this.asset?.resource}`, error)
            return false
        }
        if (sprite == null) {
            return false
        }

        // destroyed while loading; whoever replaced this artwork draws its own
        if (this.destroyed) {
            sprite.destroy()
            return false
        }

        this._sprite = sprite
        this.motion.addChild(sprite)
        this.applyLayout()

        const components = enabledComponents(this.asset.components)
        this.applyFilters(sprite, components)
        this.startAnimations(components)
        return true
    }

    private applyLayout() {
        const sprite = this._sprite
        if (sprite == null || this.frame == null) {
            return
        }
        const resolved = resolveLayout(this.frame, assetSpriteSize(sprite), this.asset)
        sprite.anchor.set(resolved.anchor.x, resolved.anchor.y)
        sprite.width = resolved.width
        sprite.height = resolved.height
    }

    private applyFilters(sprite: AssetSprite, components: Array<Component>) {
        const filters = componentFilters(components)
        sprite.tint = filters.tint
        if (filters.matrix != null) {
            this.filter = new PIXI.ColorMatrixFilter()
            this.filter.matrix = filters.matrix as PIXI.ColorMatrix
            sprite.filters = [this.filter]
        }
    }

    private startAnimations(components: Array<Component>) {
        this.animations = components
            .map(component => ({ component, property: animationProperty(component) }))
            .filter((animation): animation is { component: Component, property: AnimationProperty } => animation.property != null)
        if (this.animations.length == 0) {
            return
        }
        this.elapsed = 0
        this.applyAnimations()
        PIXI.Ticker.shared.add(this.tick, this)
        this.ticking = true
    }

    private tick(ticker: PIXI.Ticker) {
        this.elapsed += ticker.deltaMS
        if (!this.applyAnimations()) {
            this.stopTicking()
        }
    }

    /**
     * Sets `motion` to the animations' values at the current time. Several of one kind combine:
     * rotations add, scales and opacities multiply. A finished animation contributes nothing.
     *
     * @returns Whether any animation is still running.
     */
    private applyAnimations(): boolean {
        let rotation = 0
        let scale = 1
        let alpha = 1
        let running = false

        for (const { component, property } of this.animations) {
            const value = sampleAnimation(component, this.elapsed)
            if (value == null) {
                continue
            }
            running = true
            switch (property) {
                case "rotation": rotation += value; break
                case "scale": scale *= value; break
                case "opacity": alpha *= value; break
            }
        }

        this.motion.rotation = rotation
        this.motion.scale.set(scale)
        this.motion.alpha = alpha
        return running
    }

    private stopTicking() {
        if (this.ticking) {
            PIXI.Ticker.shared.remove(this.tick, this)
            this.ticking = false
        }
    }
}

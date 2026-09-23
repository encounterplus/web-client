import * as PIXI from 'pixi.js'
import { Asset, AssetVideo } from 'src/app/shared/models/asset';
import { Loader } from '../models/loader';
import { SplitAlphaVideo } from './split-alpha-video';

/**
 * The drawn artwork of an asset: a still image (a plain sprite), an animated sprite sheet (an
 * `AnimatedSprite`) or a video.
 *
 * All kinds take `anchor`, `width`, `height`, `tint`, `alpha` and `filters`, so a view can place
 * one without knowing which it has. A video holds a shared decoder: `destroy()` it when done.
 */
export type AssetSprite = PIXI.Sprite | SplitAlphaVideo

/**
 * Loads an asset's artwork, ready to add to a view. Sprite sheets are already playing.
 *
 * @returns `null` when the asset has no resource.
 * @throws when a video fails to load — a view should fall back to its plain shape.
 */
export async function loadAssetSprite(asset: Asset): Promise<AssetSprite | null> {
    if (asset?.resource == null) {
        return null
    }

    if (AssetVideo.isVideo(asset)) {
        return SplitAlphaVideo.create(asset)
    }

    const texture = await Loader.shared.loadTexture(asset.resource)
    if (texture == null) {
        return null
    }

    const frameWidth = asset.parameters?.frameWidth ?? 0
    const frameHeight = asset.parameters?.frameHeight ?? 0
    if (asset.type != "spriteSheet" || frameWidth <= 0 || frameHeight <= 0) {
        // a still image: no frame list, nothing on the ticker — maps can hold many of these
        return new PIXI.Sprite(texture)
    }

    let frames: Array<PIXI.Texture> = []
    for (let x = 0, y = 0; x < texture.source.width && y < texture.source.height;) {
        let rect = new PIXI.Rectangle(x, y, frameWidth, frameHeight)
        frames.push(new PIXI.Texture({ source: texture.source, frame: rect }))
        x += frameWidth
        if (x >= texture.source.width) {
            x = 0
            y += frameHeight
        }
    }

    const sprite = new PIXI.AnimatedSprite(frames)
    if (frames.length > 1) {
        const duration = asset.parameters?.duration ?? 1.0
        sprite.animationSpeed = frames.length / duration / 60.00
        sprite.play()
    }
    return sprite
}

/** The artwork's size at scale 1 — for a split-alpha video, its colour half. */
export function assetSpriteSize(sprite: AssetSprite): { width: number, height: number } {
    if (sprite instanceof SplitAlphaVideo) {
        return { width: sprite.naturalWidth, height: sprite.naturalHeight }
    }
    return { width: sprite.texture.width, height: sprite.texture.height }
}

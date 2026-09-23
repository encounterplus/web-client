import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { AreaEffect, AreaEffectShape } from 'src/app/shared/models/area-effect';
import { Asset } from 'src/app/shared/models/asset';
import { ArtworkFrame, AssetArtwork } from './asset-artwork';

export function toRadians(degrees: number) {
	return degrees * Math.PI / 180;
}

export function toDegrees(radians: number) {
	return radians * 180 / Math.PI;
}

export class AreaEffectView extends View {

    areaEffect: AreaEffect;
    grid: Grid;

    /** The effect's asset, with its placement parameters and components; `null` without one. */
    artwork: AssetArtwork | null = null;

    /** Set when the asset has nothing to draw, so the plain shape stands in; reset by `clear()`. */
    private artworkFailed = false;

    shapeGraphics!: PIXI.Graphics;
    handlesGraphics!: PIXI.Graphics;

    selected: boolean = false;

    constructor(areaEffect: AreaEffect, grid: Grid) {
        super();
        this.areaEffect = areaEffect;
        this.grid = grid;

        
        this.interactiveChildren = false
        this.eventMode = 'none'
        // this.buttonMode = true;

        this
            .on('pointerup', this.onClick)
    }

    get start(): PIXI.Point {
        return new PIXI.Point(this.areaEffect.x, this.areaEffect.y);
    }

    get end(): PIXI.Point {
        return new PIXI.Point(this.start.x + (this.areaEffect.length * Math.cos(this.areaEffect.angle)), this.start.y + (this.areaEffect.length * Math.sin(this.areaEffect.angle)));
    }

    // calculateHitArea(): PIXI.IHitArea {
    //     switch (this.areaEffect.shape) {
    //         case AreaEffectShape.sphere:
    //         case AreaEffectShape.cylinder:
    //             return new PIXI.Circle(this.areaEffect.x, this.areaEffect.y, this.areaEffect.radius)

    //         case AreaEffectShape.cube:
    //             // graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.length / 2), this.areaEffect.length, this.areaEffect.length);
    //             // graphics.pivot.x = this.areaEffect.x;
    //             // graphics.pivot.y = this.areaEffect.y;
    //             // graphics.rotation = this.areaEffect.angle;
    //             // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
    //             // break;

    //         case AreaEffectShape.square:
    //             // graphics.drawRect(this.areaEffect.x - this.areaEffect.length, this.areaEffect.y - this.areaEffect.length, this.areaEffect.length * 2, this.areaEffect.length * 2);
    //             // graphics.pivot.x = this.areaEffect.x;
    //             // graphics.pivot.y = this.areaEffect.y;
    //             // graphics.rotation = this.areaEffect.angle;
    //             // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
    //             // break;
            
    //         case AreaEffectShape.cone:
    //             // graphics.moveTo(this.areaEffect.x, this.areaEffect.y);
    //             // graphics.arc(this.areaEffect.x, this.areaEffect.y, this.areaEffect.length, this.areaEffect.angle - toRadians(26.5), this.areaEffect.angle + toRadians(26.5), false);
    //             // graphics.lineTo(this.areaEffect.x, this.areaEffect.y);
    //             // break;

    //         case AreaEffectShape.line:
    //             // graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.width / 2), this.areaEffect.length, this.areaEffect.width);
    //             // graphics.pivot.x = this.areaEffect.x;
    //             // graphics.pivot.y = this.areaEffect.y;
    //             // graphics.rotation = this.areaEffect.angle;
    //             // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
    //             // break;
    //     }

    //     return null;
    // }

    async draw() {
        this.clear()
        this.update();
        
        await this.drawShape();
        await this.drawHandles();

        if (this.areaEffect.asset != null) {
            await this.drawAsset(this.areaEffect.asset);
        }

        return this;
    }

    async drawShape() {
        const color = new PIXI.Color(this.areaEffect.color);
        let graphics = new PIXI.Graphics();

        switch (this.areaEffect.shape) {
            case AreaEffectShape.sphere:
            case AreaEffectShape.cylinder:
                graphics.circle(this.areaEffect.x, this.areaEffect.y, this.areaEffect.radius)
                    .fill({ color, alpha: 0.3 }).stroke({ width: 1, color });
                break;

            case AreaEffectShape.cube:
                graphics.rect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.length / 2), this.areaEffect.length, this.areaEffect.length)
                    .fill({ color, alpha: 0.3 }).stroke({ width: 1, color });
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;

            case AreaEffectShape.square:
                graphics.rect(this.areaEffect.x - this.areaEffect.length, this.areaEffect.y - this.areaEffect.length, this.areaEffect.length * 2, this.areaEffect.length * 2)
                    .fill({ color, alpha: 0.3 }).stroke({ width: 1, color });
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;
            
            case AreaEffectShape.cone:
                graphics.moveTo(this.areaEffect.x, this.areaEffect.y);
                graphics.arc(this.areaEffect.x, this.areaEffect.y, this.areaEffect.length, this.areaEffect.angle - toRadians(26.5), this.areaEffect.angle + toRadians(26.5), false);
                graphics.lineTo(this.areaEffect.x, this.areaEffect.y);
                graphics.fill({ color, alpha: 0.3 }).stroke({ width: 1, color });
                break;

            case AreaEffectShape.line:
                graphics.rect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.width / 2), this.areaEffect.length, this.areaEffect.width)
                    .fill({ color, alpha: 0.3 }).stroke({ width: 1, color });
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;
        }
        this.addChild(graphics);
        this.shapeGraphics = graphics;
        this.updateShapeVisibility();

        return this;
    }

    async drawHandles() {
        let graphics = new PIXI.Graphics();
        graphics
            .circle(this.start.x, this.start.y, 5)
            .circle(this.end.x, this.end.y, 5)
            .fill(new PIXI.Color(this.areaEffect.color))
            .stroke({ width: 1, color: 0xffffff });
        this.addChild(graphics);

        graphics.visible = this.selected;
        this.handlesGraphics = graphics;

        return this;
    }

    async drawAsset(asset: Asset) {
        const artwork = new AssetArtwork(asset);
        artwork.position.set(this.areaEffect.x, this.areaEffect.y);
        artwork.rotation = this.areaEffect.angle;
        artwork.layout(this.artworkFrame());
        this.addChild(artwork);
        this.artwork = artwork;

        // a clear() meanwhile destroys the artwork, which discards the load
        const drawn = await artwork.loaded;
        if (!drawn && this.artwork === artwork) {
            // nothing to show; the plain shape stands in
            this.removeChild(artwork);
            artwork.destroy();
            this.artwork = null;
            this.artworkFailed = true;
            this.updateShapeVisibility();
        }

        return this;
    }

    /**
     * Where the artwork goes for each shape, around the effect's origin and turned by its angle:
     * centred on a sphere, cylinder or square, and running out from the origin along a cone, cube
     * or line — matching the outline `drawShape` draws.
     */
    artworkFrame(): ArtworkFrame {
        const areaEffect = this.areaEffect;
        switch (areaEffect.shape) {
            case AreaEffectShape.sphere:
            case AreaEffectShape.cylinder:
                return { width: areaEffect.radius * 2, height: areaEffect.radius * 2 };
            case AreaEffectShape.square:
                return { width: areaEffect.length * 2, height: areaEffect.length * 2 };
            case AreaEffectShape.cube:
            case AreaEffectShape.cone:
                return { width: areaEffect.length, height: areaEffect.length, anchor: { x: 0, y: 0.5 } };
            case AreaEffectShape.line:
                return { width: areaEffect.length, height: areaEffect.width, anchor: { x: 0, y: 0.5 } };
            default:
                return { width: areaEffect.length, height: areaEffect.length };
        }
    }

    update() {

        // this.w = this.tile.width;
        // this.h = this.tile.height;

        // this.position.set(this.tile.x, this.tile.y)
        // this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.areaEffect.zIndex;
        this.alpha = this.areaEffect.opacity;
        // this.hitArea = this.calculateHitArea();

        this.visible = !this.areaEffect.hidden;
    }

    clear() {
        this.removeChildren();

        // stops its animations, and gives a video's shared decoder back
        this.artwork?.destroy();
        this.artwork = null;
        this.artworkFailed = false;
    }

    /** Stops everything this view runs. Call before dropping it. */
    dispose() {
        this.clear();
    }

    onClick() {
        this.selected = !this.selected;
        this.handlesGraphics.visible = this.selected;
        this.updateShapeVisibility();
    }

    /** The outline shows while selected, and always when there is no artwork to show instead. */
    private updateShapeVisibility() {
        if (this.shapeGraphics == null) {
            return;
        }
        const showsArtwork = this.areaEffect.asset != null && !this.artworkFailed;
        this.shapeGraphics.visible = this.selected || !showsArtwork;
    }
}

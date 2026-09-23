import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Aura } from 'src/app/shared/models/aura';
import { Asset } from 'src/app/shared/models/asset';
import { AssetArtwork } from './asset-artwork';


export class AuraView extends View {

    aura: Aura;
    grid: Grid;

    /** The aura's asset, with its placement parameters and components; `null` without one. */
    artwork: AssetArtwork | null = null;

    shapeGraphics!: PIXI.Graphics;

    constructor(aura: Aura, grid: Grid) {
        super();
        this.aura = aura;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();

        await this.drawShape();

        if (this.aura.asset != null) {
            await this.drawAsset(this.aura.asset);
        }

        return this;
    }

    async drawShape() {
        let graphics = new PIXI.Graphics();
        graphics.circle(-this.w / 2, -this.h / 2, this.w / 2)
            .fill({ color: new PIXI.Color(this.aura.color), alpha: 0.15 })
            .stroke({ width: 1, color: new PIXI.Color(this.aura.color) });
        this.addChild(graphics);
        this.shapeGraphics = graphics;

        // hidden while artwork loads; drawAsset brings it back if there is none
        this.shapeGraphics.visible = this.aura.asset == null;
        return this;
    }

    async drawAsset(asset: Asset) {
        const artwork = new AssetArtwork(asset);
        artwork.position.set(-this.w / 2, -this.h / 2);
        artwork.layout({ width: this.w, height: this.h });
        this.addChild(artwork);
        this.artwork = artwork;

        // a clear() meanwhile destroys the artwork, which discards the load
        const drawn = await artwork.loaded;
        if (!drawn && this.artwork === artwork) {
            // nothing to show; the plain circle stands in
            this.removeChild(artwork);
            artwork.destroy();
            this.artwork = null;
            this.shapeGraphics.visible = true;
        }

        return this;
    }

    update() {
        this.alpha = this.aura.opacity;
    }

    clear() {
        this.removeChildren();

        // stops its animations, and gives a video's shared decoder back
        this.artwork?.destroy();
        this.artwork = null;
    }

    /** Stops everything this view runs. Call before dropping it. */
    dispose() {
        this.clear();
    }
}

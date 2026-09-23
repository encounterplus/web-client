import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Tile, tileLayer } from 'src/app/shared/models/tile';
import { MapLayer } from 'src/app/shared/models/map';
import { AssetArtwork } from './asset-artwork';

export class TileView extends View {

    tile: Tile;
    grid: Grid;

    /** The tile's asset, with its placement parameters and components; `null` without one. */
    artwork: AssetArtwork | null = null;

    mapLayer: MapLayer = MapLayer.object;

    constructor(tile: Tile, grid: Grid) {
        super();
        this.tile = tile;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();

        await this.drawAsset()
        return this;
    }

    async drawAsset() {
        if (this.tile.asset == null) {
            return this
        }

        const artwork = new AssetArtwork(this.tile.asset);
        artwork.angle = this.tile.rotation;
        artwork.alpha = this.tile.opacity ?? 1;
        artwork.layout({
            width: this.tile.width,
            height: this.tile.height,
            fit: "aspectFit",
            scale: this.tile.scale,
        });
        this.addChild(artwork);
        this.artwork = artwork;

        // a clear() meanwhile destroys the artwork, which discards the load
        await artwork.loaded;
        return this;
    }

    update() {

        this.w = this.tile.width;
        this.h = this.tile.height;

        this.position.set(this.tile.x, this.tile.y)
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.tile.zIndex ?? 0;

        this.visible = !this.tile.hidden;
        this.mapLayer = tileLayer(this.tile);
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

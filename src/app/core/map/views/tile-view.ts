import { Creature } from 'src/app/shared/models/creature';
import { View } from './view';
import { Sprite, interaction } from 'pixi.js';
import { environment } from 'src/environments/environment';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEvent, WSEventName } from 'src/app/shared/models/wsevent';
import { Tile } from 'src/app/shared/models/tile';

export class TileView extends View {

    tile: Tile;
    grid: Grid;

    assetTexture: PIXI.Texture;
    assetSprite: PIXI.Sprite;

    constructor(tile: Tile, grid: Grid, private dataService: DataService) {
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
        // texture
        // this.tokenTexture = await this.loadTexture('/assets/img/token.png');
        
        if (this.tile.asset.resource != null) {
            this.assetTexture = await Loader.shared.loadTexture(this.tile.asset.resource);
        } else {
            return this;
        }

        // sprite
        if (this.assetTexture != null) {
            let sprite = new PIXI.Sprite(this.assetTexture);
            sprite.anchor.set(0.5, 0.5);
            sprite.width = this.tile.width;
            sprite.height = this.tile.height;
            sprite.angle = this.tile.rotation;
            this.assetSprite = this.addChild(sprite);
        }

        return this;
    }

    update() {

        this.w = this.tile.width;
        this.h = this.tile.height;

        this.position.set(this.tile.x, this.tile.y)
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.tile.zIndex;
    }

    clear() {
        this.removeChildren();
    }
}
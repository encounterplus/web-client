import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { Loader } from '../models/loader';

export class FogLayer extends Layer {

    imageTexture: PIXI.Texture;
    imageSprite: PIXI.Sprite;

    fog: string;
    fogBase64: string;


    bg: PIXI.Sprite;

    constructor() {
        super();

        this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.bg.tint = 0x000000;

        let filter = new PIXI.filters.AlphaFilter(1.0)
        filter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this.filters = [filter];
    }

    update(map: Map) {
        this.fog = map.fog;
        this.visible = map.fogVisible;
    }

    async draw() {
        this.clear();

        if (!this.visible) {
            return;
        }

        this.bg.width = this.w + 10;
        this.bg.height = this.h + 10;
        this.bg.position.set(-5, -5);
        this.addChild(this.bg);

        if (this.fog == null && this.fogBase64 == null) {
            return this;
        }

        // start loading map image
        if (this.imageTexture == null) {  
            this.imageTexture = await Loader.shared.loadTexture(this.fog);
        }

        if(this.imageTexture == null) {
            return this;
        }

        let imageSprite = new PIXI.Sprite(this.imageTexture);
        imageSprite.width = this.imageTexture.width;
        imageSprite.height = this.imageTexture.height;

        console.log(imageSprite);
        this.addChild(imageSprite);      
    }

    async drawPartialFog() {
        if (this.fog != null || this.fogBase64 != null) {
            // start loading map image
            let oldTexture = this.imageTexture;
            this.imageTexture = this.fogBase64 != null ? await Loader.shared.loadTextureBase64(this.getUniqueId(), this.fogBase64) : await Loader.shared.loadTexture(this.fog);
            PIXI.BaseTexture.removeFromCache(this.imageTexture.baseTexture.textureCacheIds[1]);
            PIXI.Texture.removeFromCache(this.imageTexture.textureCacheIds[1]);
            oldTexture.destroy(true);
        }

        await this.draw();
    }

    getUniqueId(parts: number = 2): string {
        const stringArr = [];
        for(let i = 0; i< parts; i++){
          const S4 = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
          stringArr.push(S4);
        }
        return stringArr.join('-');
    }

    clear() {
        this.imageSprite = null;
        this.removeChildren();
    }
}
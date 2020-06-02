import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';

export class BackgroundLayer extends Layer {

    imageTexture: PIXI.Texture;
    imageSprite: PIXI.Sprite;
    videoSprite: PIXI.Sprite;

    loadingText = new PIXI.Text("Loading map image...", {fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});

    image: string;
    video: string;

    map: Map;

    constructor(private dataService: DataService) {
        super();
    }

    update(map: Map) {
        this.map = map;
        this.image = map.image;
        this.scale.set(map.scale, map.scale);
        // this.video = map.video;
    }

    async draw() {
        this.clear();

        if (this.image == null) {
            this.w = 2000;
            this.h = 2000;
            return this;
        }

        // add loading text
        this.addChild(this.loadingText);
        this.loadingText.anchor.set(0.5, 0.5)
        this.loadingText.position.set(window.innerWidth / 2.0, window.innerHeight / 2);

        // start loading map image
        this.imageTexture = await Loader.shared.loadTexture(this.image);

        // clean loading
        this.removeChildren();

        if(this.imageTexture == null) {
            this.w = 2000;
            this.h = 2000;
            return this;
        }

        this.w = this.imageTexture.width;
        this.h = this.imageTexture.height;

        let sprite = new PIXI.Sprite(this.imageTexture);
        sprite.width = this.imageTexture.width;
        sprite.height = this.imageTexture.height;
        this.imageSprite = this.addChild(sprite);

        console.log(`map size: ${this.w}x${this.h}`)
    }

    clear() {
        this.imageSprite = null;
        this.videoSprite = null
        this.removeChildren();
    }
}
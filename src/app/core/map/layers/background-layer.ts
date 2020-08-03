import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';

export class BackgroundLayer extends Layer {

    imageTexture: PIXI.Texture;
    imageSprite: PIXI.Sprite;

    videoTexture: PIXI.Texture;
    videoSprite: PIXI.Sprite;

    loadingText = new PIXI.Text("Loading map resources...", {fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});

    image: string;
    video: string;

    map: Map;

    constructor(private dataService: DataService) {
        super();
    }

    update(map: Map) {
        this.map = map;
        this.image = map.image;
        this.video = map.video;
        this.scale.set(map.scale, map.scale);
    }

    async draw() {
        this.clear();

        if (this.image == null && this.video == null) {
            this.w = 2000;
            this.h = 2000;
            return this;
        }

        // add loading text
        this.addChild(this.loadingText);
        this.loadingText.anchor.set(0.5, 0.5)
        this.loadingText.position.set(window.innerWidth / 2.0, window.innerHeight / 2);

        // load map image
        if (this.image != null) {
            this.imageTexture = await Loader.shared.loadTexture(this.image);
        }

        // TODO: video texture loader is not ready yet
        // load map video
        if (this.video != null) {
            // this.videoTexture = await Loader.shared.loadVideoTexture(this.video);
            // this.videoTexture = await Loader.shared.loadVideoTextureFrom(this.video);
        }

        // remove loading node
        this.removeChildren();

        // return if there is no texture
        if(this.imageTexture == null && this.videoTexture == null) {
            this.w = 2000;
            this.h = 2000;
            return this;
        }

        this.w = this.imageTexture?.width || this.videoTexture?.width || 2000;
        this.h = this.imageTexture?.height || this.videoTexture?.height || 2000;

        if (this.imageTexture) {
            let sprite = new PIXI.Sprite(this.imageTexture);
            sprite.width = this.imageTexture.width;
            sprite.height = this.imageTexture.height;
            this.addChild(sprite);
            this.imageSprite = sprite;
        }

        if (this.videoTexture) {
            let sprite = new PIXI.Sprite(this.videoTexture);
            sprite.width = this.videoTexture.width;
            sprite.height = this.videoTexture.height;
            this.addChild(sprite);
            this.videoSprite = sprite;

            let videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
            let video = videoResource.source as HTMLVideoElement;

            video.muted = true;
            video.loop = true
            video.play();
        }

        console.log(`map size: ${this.w}x${this.h}`)
    }

    clear() {
        // this.imageSprite = null;
        // this.videoSprite = null
        this.removeChildren();

        // if (this.videoSprite) this.videoSprite.destroy();

        if (this.video) Loader.shared.destroy(this.video);

        // if (this.imageTexture) this.imageTexture.destroy();
        if (this.videoTexture) this.videoTexture.destroy()

        this.imageSprite = null;
        this.videoSprite = null;
        this.imageTexture = null;
        this.videoTexture = null;
    }
}
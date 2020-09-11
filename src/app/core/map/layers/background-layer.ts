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
    vidloadingText = new PIXI.Text("Loading video map...", {fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});

    image: string;
    video: string;
    loadedVideoSrc: string;
    loadedVideoUrl: string;

    map: Map;

    constructor(private dataService: DataService) {
        super();
    }

    update(map: Map) {
        if (map == null) {
            this.image = null;
            this.video = null;
            return;
        }
        this.image = map.image;
        this.video = map.video;
        this.scale.set(map.scale, map.scale);
    }

    async draw() {
        if (this.videoTexture && this.video == this.loadedVideoSrc && this.loadedVideoUrl != null) {
            console.log("Video already loaded, skipping redraw");
            return
        }
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
        if (this.video != null && this.image != null) {
            let videoSrc = this.video;
            if (videoSrc == this.loadedVideoSrc && this.loadedVideoUrl != null) {
                videoSrc = this.loadedVideoUrl;
            }
            Loader.shared.loadVideoTexture(videoSrc,this.vidloadingText).then( vidtex => {
                this.videoTexture = vidtex;
                this.drawVideo();
            } ).catch((error) => {
                console.log(error)
            });
        } else if (this.video != null) {
            let videoSrc = this.video;
            if (videoSrc == this.loadedVideoSrc && this.loadedVideoUrl != null) {
                videoSrc = this.loadedVideoUrl;
            }
            this.videoTexture = await Loader.shared.loadVideoTexture(videoSrc,this.loadingText);
            //this.videoTexture = await Loader.shared.loadVideoTextureFrom(this.video);
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
            if (this.video) {
                this.addChild(this.vidloadingText);
                this.vidloadingText.style.fontSize = sprite.height*.05;
                this.vidloadingText.anchor.set(0, 1);
                this.vidloadingText.position.set(0,sprite.height);
            }
        } else if (this.videoTexture) {
            this.drawVideo();
        }

        console.log(`map size: ${this.w}x${this.h}`)
    }

    drawVideo() {
        let sprite = new PIXI.Sprite(this.videoTexture);
        sprite.width = this.videoTexture.width;
        sprite.height = this.videoTexture.height;
        this.removeChildren();
        this.addChild(sprite);
        this.videoSprite = sprite;

        const videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
        const video = videoResource.source as HTMLVideoElement;

        this.loadedVideoSrc = this.video;
        this.loadedVideoUrl = video.src;
    }

    clear() {
        // this.imageSprite = null;
        // this.videoSprite = null
        this.removeChildren();

        // if (this.videoSprite) this.videoSprite.destroy();

        if (this.video) Loader.shared.destroy(this.video);

        // if (this.imageTexture) this.imageTexture.destroy();
        if (this.videoTexture) {
            const videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
            const video = videoResource.source as HTMLVideoElement;
            video.onpause = video.onplay = video.onvolumechange = null;
            video.pause();
            video.muted = true;
            video.src = "";
            video.remove();
            if (document.getElementById("video-play")) document.getElementById("video-play").onclick = null;
            if (document.getElementById("video-mute")) document.getElementById("video-mute").onclick = null;
            if (this.video != this.loadedVideoSrc) {
                URL.revokeObjectURL(video.src);
                this.loadedVideoSrc = null;
                this.loadedVideoUrl = null;
            }
            this.videoTexture.destroy();
        }
        this.imageSprite = null;
        this.videoSprite = null;
        this.imageTexture = null;
        this.videoTexture = null;
    }
}

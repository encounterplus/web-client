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

    videoPaused: boolean = false;
    videoMuted: boolean = true;

    allowVideo: boolean = (localStorage.getItem("allowVideo") || "true") == "true";

    constructor(private dataService: DataService) {
        super();

        dataService.videoMuted.subscribe(value => {
            this.videoMuted = value;

            if (this.videoTexture) {
                const videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
                const video = videoResource.source as HTMLVideoElement;
                video.muted = value;
            }  
        })

        dataService.videoPaused.subscribe(value => {
            this.videoPaused = value;

            if (this.videoTexture) {
                const videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
                const video = videoResource.source as HTMLVideoElement;
                
                if (value) {
                    video.pause();
                } else {
                    video.play();
                }
            }  
        })
    }

    update(map: Map) {
        if (map == null) {
            this.image = null;
            this.video = null;
            return;
        }
        this.image = map.image;
        this.video = map.video;
        this.allowVideo = (localStorage.getItem("allowVideo") || "true") == "true";

        this.w = map.width || 2048;
        this.h = map.height || 2048;

        this.scale.set(map.scale, map.scale);
    }

    async draw() {
        if (this.videoTexture && this.video == this.loadedVideoSrc && this.loadedVideoUrl != null) {
            console.log("Video already loaded, skipping redraw");
            return this;
        }
        this.clear();

        if (this.image == null && this.video == null) {
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

        // load map video
        if (this.video != null) {
            // //preset canvas to 1080p if no placeholder image
            // if (this.image == null) {
            //     const baseRenderTexture = new PIXI.BaseRenderTexture({ width: 1920, height: 1080 });
            //     this.imageTexture = new PIXI.RenderTexture(baseRenderTexture);
            // }
            let videoSrc = this.video;
            if (videoSrc == this.loadedVideoSrc && this.loadedVideoUrl != null) {
                videoSrc = this.loadedVideoUrl;
            }
            if (this.allowVideo) {
                Loader.shared.loadVideoTexture(videoSrc,this.vidloadingText).then( vidtex => {
                    this.videoTexture = vidtex;
                    this.drawVideo();
                } ).catch((error) => {
                    console.log(error)
                });
            }
        }

        //this.w = this.imageTexture?.width || this.videoTexture?.width || 2048;
        //this.h = this.imageTexture?.height || this.videoTexture?.height || 2048;

        // remove loading node
        this.removeChildren();

        //add video loading node
        if (this.allowVideo && this.video != null) {
            this.addChild(this.vidloadingText);
            this.vidloadingText.style.fontSize = this.h*.05;
            this.vidloadingText.anchor.set(0, 1);
            this.vidloadingText.position.set(0,this.h);
        }

        // return if there is no texture
        if(this.imageTexture == null && this.videoTexture == null) {
            return this;
        }

        if (this.imageTexture) {
            let sprite = new PIXI.Sprite(this.imageTexture);
            sprite.width = this.imageTexture.width;
            sprite.height = this.imageTexture.height;
            this.addChild(sprite);
            this.imageSprite = sprite;
            if (this.allowVideo && this.video) {
                this.addChild(this.vidloadingText);
                this.vidloadingText.style.fontSize = sprite.height*.05;
                this.vidloadingText.anchor.set(0, 1);
                this.vidloadingText.position.set(0,sprite.height);
            }
        }

        console.log(`map size: ${this.w}x${this.h}`)
    }

    drawVideo() {
        let sprite = new PIXI.Sprite(this.videoTexture);
        this.w = sprite.width = this.videoTexture.width;
        this.h = sprite.height = this.videoTexture.height;
        this.removeChildren();
        this.addChild(sprite);
        this.videoSprite = sprite;

        const videoResource = this.videoTexture.baseTexture.resource as PIXI.resources.VideoResource;
        const video = videoResource.source as HTMLVideoElement;

        this.loadedVideoSrc = this.video;
        this.loadedVideoUrl = video.src;

        if (this.videoPaused) {
            video.pause();
        }

        video.muted = this.videoMuted;

        this.emit("videoloaded");
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
            
            // if (document.getElementById("video-play")) document.getElementById("video-play").onclick = null;
            // if (document.getElementById("video-mute")) document.getElementById("video-mute").onclick = null;
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

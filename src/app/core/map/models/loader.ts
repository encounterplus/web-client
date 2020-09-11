export class Loader {

    private static instance: Loader;

    private constructor() {}

    public static get shared(): Loader {
        if (!Loader.instance) {
            Loader.instance = new Loader();
        }

        return Loader.instance;
    }

    RESOURCE_LOADER_OPTIONS = {
        autoLoad: true,
        autoPlay: false,
        crossOrigin: 'anonymous',
        crossorigin: "anonymous"
    };

    remoteBaseURL: string = "";

    cache: Map<string, PIXI.Texture> = new Map();

    getTexture(src: string): PIXI.Texture {

        const loader = PIXI.Loader.shared;
        let cached = loader.resources[src];
        if ( !cached ) return null;

        if (cached.texture != null) {
            return cached.texture;
        } else {
            let bt = PIXI.BaseTexture.from(cached.data, {
                resourceOptions: this.RESOURCE_LOADER_OPTIONS
            });
            return new PIXI.Texture(bt); 
        }
    }

    async loadTexture(src: string, local: boolean = false): Promise<PIXI.Texture> {

        if (local == false) {
            src = this.remoteBaseURL + src;
        }
        let tex = this.getTexture(src);
        if ( tex ) return tex;

        tex = PIXI.Texture.from(src, {resourceOptions: this.RESOURCE_LOADER_OPTIONS});

        return new Promise((resolve, reject) => {
          let base = tex.baseTexture;
          if ( base.valid ) resolve(tex);
          base.once("loaded", f => resolve(tex));
          base.once("error", base => {
            console.error(`Failed to load resource ${src}`);
            delete PIXI.Loader.shared.resources[base.resource.url];
            base.destroy();
            // reject(err);
            resolve(null);
          });
        });
    }

    async loadTextureBase64(name: string, base64string: string): Promise<PIXI.Texture> {
        let tex = this.getTexture(name);
        if ( tex ) return tex;

        return new Promise((resolve, reject) => {
            const loader = PIXI.Loader.shared;
            loader.add(name, base64string).load( function(loader, resources) {
                let res = resources[name];
                if (res) {
                    resolve(res.texture);
                } else {
                    console.error(`Failed to load resource ${name}`);
                    delete PIXI.Loader.shared.resources[name];
                    resolve(null);
                }
            })
        });
    }

    // TOOD: this is not working very well
    async loadVideoTexture(src: string, loadingText: PIXI.Text = null, local: boolean = false): Promise<PIXI.Texture> {
        if (local == false && !src.startsWith("blob:")) {
            src = this.remoteBaseURL + src;
        }

        const tex = this.cache.get(src)
        if ( tex && tex.baseTexture && tex.baseTexture.valid ) {
            console.log("video cache hit");
            return tex;
        }
        const video = document.createElement("VIDEO") as HTMLVideoElement;
        video.setAttribute('preload', 'auto');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('playsinline', '');
        video.crossOrigin = "anonymous";
        //video.src = src;
        let videosrcurl: string;
        if (!src.startsWith("blob:")) {
            const res = await fetch(src);
            const length = Number(res.headers.get('Content-Length'));
            const mime = res.headers.get('Content-Type');
            const arrayBuffer = new Uint8Array(length);
            const reader = res.body.getReader();
            let at = 0;
            let pos = 0;
            console.log("Downloading video");
            while(true) {
                const {done, value} = await reader.read();
                if (done) {
                    console.log("Finished");
                    break;
                }
                arrayBuffer.set(value, at);
                at += value.length;
                if (Math.trunc(at/length*100) > pos) {
                    pos = Math.trunc(at/length*100)
                    loadingText.text = `Loading video map: ${pos}%`;
                }
            }
            console.log("Loading blob...");
            const videosrc = new Blob([arrayBuffer], { type: mime });
            console.log("Setting src to blob url");
            videosrcurl = URL.createObjectURL(videosrc);
        } else {
            console.log("Setting src to existing blob url");
            videosrcurl = src;
        }

        console.log("returning promise");
        return new Promise((resolve, reject) => {
            video.oncanplaythrough = () => {
                console.log(`video size: ${video.videoWidth}x${video.videoHeight}`)
                document.getElementById("video-ctls").style.display = "";
                const ppBtn = document.getElementById("video-play");
                const ppBtnClass = (ppBtn.firstChild as HTMLElement).classList;
                const muteBtn = document.getElementById("video-mute");
                const muteBtnClass = (muteBtn.firstChild as HTMLElement).classList;
                ppBtn.onclick = (_) => {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                };
                muteBtn.onclick = (_) => video.muted = !video.muted;
                video.onpause = (_) => {
                    if (ppBtnClass.contains('fa-pause')) ppBtnClass.remove('fa-pause');
                    if (!ppBtnClass.contains('fa-play')) ppBtnClass.add('fa-play');
                };
                video.onplay = (_) => {
                    if (ppBtnClass.contains('fa-play')) ppBtnClass.remove('fa-play');
                    if (!ppBtnClass.contains('fa-pause')) ppBtnClass.add('fa-pause');
                };
                video.onvolumechange = (_) => {
                    if (video.muted) {
                        if (muteBtnClass.contains('fa-volume-up')) muteBtnClass.remove('fa-volume-up');
                        if (!muteBtnClass.contains('fa-volume-off')) muteBtnClass.add('fa-volume-off');
                    } else {
                        if (muteBtnClass.contains('fa-volume-off')) muteBtnClass.remove('fa-volume-off');
                        if (!muteBtnClass.contains('fa-volume-up')) muteBtnClass.add('fa-volume-up');
                    }
                };

                video.height = video.videoHeight;
                video.width = video.videoWidth;
                video.muted = true;
                video.loop = true;
                video.play();
                const bt = PIXI.BaseTexture.from(video);
                const tex = new PIXI.Texture(bt);
                // console.log(tex);
                // this.cache.set(src, tex);
                resolve(tex);
            };
            video.onerror = (e) => {
                console.log("Error " + video.error.code + " loading video: " + video.error.message)
                reject();
            }
            video.src = videosrcurl;
            console.log("Loading video");
            video.load();
        });
    }

    // This is better texture loader, but m4v is not supported
    async loadVideoTextureFrom(src: string, local: boolean = false): Promise<PIXI.Texture> {

        if (local == false) {
            src = this.remoteBaseURL + src;
        }
        let tex = PIXI.Texture.from(src, {resourceOptions: this.RESOURCE_LOADER_OPTIONS});

        return new Promise((resolve, reject) => {
            let base = tex.baseTexture;
            if ( base.valid ) resolve(tex);
            base.once("loaded", f => resolve(tex));
            base.once("error", base => {
                console.error(`Failed to load resource ${src}`);
                delete PIXI.Loader.shared.resources[base.resource.url];
                base.destroy();
                // reject(err);
                resolve(null);
            });
        });
    }

    getResource(src: string): PIXI.LoaderResource {
        const loader = PIXI.Loader.shared;
        let cached = loader.resources[src];
        if ( !cached ) return null;
        return cached;
    }

    async loadResource(src: string): Promise<PIXI.LoaderResource> {
        let res = this.getResource(src);
        if ( res ) return res;

        return new Promise((resolve, reject) => {
            const loader = PIXI.Loader.shared;
            loader.add(src, src).load( function(loader, resources) {
                let res = resources[src];
                if (res) {
                    resolve(res);
                } else {
                    let err = new Error(`Failed to load resource ${src}`);
                    delete PIXI.Loader.shared.resources[src];
                    resolve(null);
                }
            })
        });
    }

    destroy(src: string) {
        const loader = PIXI.Loader.shared;
        if (loader.resources[src]) {
            loader.resources[src].texture.destroy(true);
            delete loader.resources[src];
        }
    }
}

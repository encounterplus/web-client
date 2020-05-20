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
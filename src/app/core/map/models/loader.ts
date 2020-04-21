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

    async loadTexture(src: string): Promise<PIXI.Texture> {

        // First try to load the resource from the cache
        let tex = this.getTexture(src);
        if ( tex ) return tex;

        // Otherwise load it and wait for loading to resolve
        tex = PIXI.Texture.from(src, {resourceOptions: this.RESOURCE_LOADER_OPTIONS});

        // Return the ready texture as a Promise
        return new Promise((resolve, reject) => {
          let base = tex.baseTexture;
          if ( base.valid ) resolve(tex);
          base.once("loaded", f => resolve(tex));
          base.once("error", base => {
            // let message = `Failed to load texture ${base.resource.url}`;
            let err = new Error(`Failed to load texture ${base.resource.url}`);
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

        // First try to load the resource from the cache
        let res = this.getResource(src);
        if ( res ) return res;

        // Return the ready texture as a Promise
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
}
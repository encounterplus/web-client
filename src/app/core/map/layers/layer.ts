import * as PIXI from 'pixi.js';
import { AppState } from 'src/app/shared/models/app-state';

export class Layer extends PIXI.Container {

    w: number;
    h: number;
    
    async draw(): Promise<this> {
        // Clear existing layer contents
        // this.removeChildren().forEach(c => c.destroy());
        this.removeChildren();
    
        // Set basic dimensions
        this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
        return this;
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
}
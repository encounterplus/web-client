import * as PIXI from 'pixi.js';

export class Layer extends PIXI.Container {

    w: number;
    h: number;

    get size(): PIXI.ISize {
        return {width: this.w, height: this.h}
    }
    set size(value: PIXI.ISize) {
        this.w = value.width
        this.h = value.height
    }
    
    async draw(): Promise<this> {
        this.removeChildren();
    
        // Set basic dimensions
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.w);
        return this;
    }
}
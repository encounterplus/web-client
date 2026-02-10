import * as PIXI from 'pixi.js';

export class Layer extends PIXI.Container {

    w: number;
    h: number;

    constructor() {
        super()

        // force `none` event mode to all layers by default to prevent issues in event handling
        this.eventMode = "none"
    }

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
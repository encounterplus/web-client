import * as PIXI from 'pixi.js';
import { Layer } from '../layers/layer';

export class View extends Layer {

    w: number = 50;
    h: number = 50;

    get center() {
        return new PIXI.Point((this.position.x + (this.w / 2)), (this.position.y + (this.y / 2)))
    }
    set center(value: PIXI.Point) {
        this.position.set((value.x - (this.w / 2)) | 0, (value.y - (this.h / 2)) | 0);
    }

    // async draw() {

    //     // Clear existing layer contents
    //     this.removeChildren().forEach(c => c.destroy());
    
    //     // Set basic dimensions
    //     this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
    //     return this;
    // }
}
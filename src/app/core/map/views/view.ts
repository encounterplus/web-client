import * as PIXI from 'pixi.js';
import { Layer } from '../layers/layer';

export class View extends Layer {

    w: number = 50;
    h: number = 50;

    // async draw() {

    //     // Clear existing layer contents
    //     this.removeChildren().forEach(c => c.destroy());
    
    //     // Set basic dimensions
    //     this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
    //     return this;
    // }
}
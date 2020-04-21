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
}
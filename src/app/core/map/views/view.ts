import * as PIXI from 'pixi.js';

export class View extends PIXI.Container {

    w: number = 50;
    h: number = 50;

    get center() {
        return new PIXI.Point((this.position.x + (this.w / 2)), (this.position.y + (this.y / 2)))
    }
    set center(value: PIXI.Point) {
        this.position.set((value.x - (this.w / 2)) | 0, (value.y - (this.h / 2)) | 0);
    }
}
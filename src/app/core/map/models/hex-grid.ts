import { Grid, GridInterface } from "./grid";

export enum HexGridType {
    flat = "flat",
    pointy = "pointy"
}

export class HexGrid extends Grid implements GridInterface {
    
    gridGraphics(width: number, height: number): PIXI.Graphics {
        let graphics = new PIXI.Graphics();
        graphics.lineStyle(1.0, PIXI.utils.string2hex(this.color), this.opacity * 0.8, 0.5, false)
        // TODO: implement corners style with dashed line

        console.debug("rendering hex grid")

        return graphics
    }

}
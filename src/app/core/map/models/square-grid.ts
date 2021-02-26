import { pathToFileURL } from "url";
import { GridSize } from "../views/token-view";
import { Grid, GridInterface } from "./grid";

export class SquareGrid extends Grid implements GridInterface {

    get blockSize(): PIXI.ISize {
        return {width: this.size, height: this.size}
    }

    get adjustedSize(): PIXI.ISize {
        return {width: this.size, height: this.size}
    }
    
    gridGraphics(width: number, height: number): PIXI.Graphics {
        let graphics = new PIXI.Graphics();
        graphics.lineStyle(1.0, PIXI.utils.string2hex(this.color), this.opacity * 0.8, 0.5, false)
        // TODO: implement corners style with dashed line

        // columns
        let cols = Math.floor((width + this.size*.9)/ this.size);
        for (let i = 0; i < cols; i++) {
            let x = (i * this.size) + this.offsetX;
            if (x<=width) graphics.moveTo(x, 0).lineTo(x, height)
        }

        // rows
        let rows = Math.ceil((height + this.size*.9)/ this.size);
        for (let i = 0; i < rows; i++) {
            let y = (i * this.size) + this.offsetY;
            if (y<=height) graphics.moveTo(0, y).lineTo(width, y)
        }

        return graphics
    }

    sizeFromGridSize(gridSize: GridSize): PIXI.ISize {
        return {width: gridSize.width * this.size, height: gridSize.height * this.size }
    }

}
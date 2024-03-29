import * as PIXI from 'pixi.js'
import { GridSize } from "../views/token-view";
import { Grid, GridInterface } from "./grid";

export class SquareGrid extends Grid implements GridInterface {

    get blockSize(): PIXI.ISize {
        return {width: this.size, height: this.size}
    }

    get adjustedSize(): PIXI.ISize {
        return {width: this.size, height: this.size}
    }

    get pixelRatio(): number {
        return this.size / Math.max(this.scale, 0.1)
    }

    position(x: number, y: number): PIXI.Point {
        const px = Math.floor((Math.abs(x) - this.offsetX) / this.size)
        const py = Math.floor((Math.abs(y) - this.offsetY) / this.size)
        return new PIXI.Point(px, py)
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

    pathGraphics(path: Array<number>, gridSize: GridSize, color: number, graphics: PIXI.Graphics): PIXI.Graphics {
        graphics.clear()
        graphics.beginFill(color)

        for (let i = 0; i < path.length; i=i+2) {
            const pos = this.position(path[i], path[i + 1])

            let x = (pos.x * this.size) + this.offsetX
            let y = (pos.y * this.size) + this.offsetY

            let width = gridSize.width * this.size
            let height = gridSize.height * this.size

            graphics.drawRect(x, y, width, height)
        }

        graphics.endFill()
        return graphics
    }

    sizeFromGridSize(gridSize: GridSize): PIXI.ISize {
        return {width: gridSize.width * this.size, height: gridSize.height * this.size }
    }

}